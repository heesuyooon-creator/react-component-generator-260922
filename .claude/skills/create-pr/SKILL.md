---
name: create-pr
description: |
  현재 브랜치의 변경사항을 분석해 GitHub PR을 생성한다. `gh pr create`를 사용하며, 실제 diff와 커밋 히스토리에 근거해 제목·본문을 작성한다.
  "PR 만들어줘", "PR 생성해줘", "풀리퀘 만들어줘", "create-pr", "/create-pr", "create a pull request" 같은 요청에 활성화한다.
  커밋되지 않은 변경이나 push되지 않은 브랜치가 있으면 임의로 처리하지 않고 사용자에게 먼저 확인한다.
argument-hint: "[--draft] [--base <branch>]"
context: fork
background: false
---

# create-pr: 변경사항 기반 GitHub PR 생성

현재 브랜치의 커밋·diff를 분석해 GitHub PR을 생성한다. `gh` CLI를 사용하며, 제목·본문은 실제 변경 내용에 근거해 작성한다(지어내지 않는다).

## 절차

### Step 0: 사전 점검

- `gh --version`으로 `gh` CLI 설치 여부를 확인한다. 없으면 설치 방법을 안내하고 종료한다.
- `gh auth status`로 인증 상태를 확인한다. 미인증이면 `gh auth login` 안내 후 종료한다.
- 저장소 루트의 `AGENTS.md`(없으면 `CLAUDE.md`)를 찾아 읽는다. 커밋 메시지 스타일, 브랜치 전략, 빌드/테스트/린트 지침이 있으면 이후 과정에서 따른다.

### Step 1: 브랜치·변경사항 확인

- `git branch --show-current`으로 현재 브랜치를 확인한다. base 브랜치는 인자로 `--base <branch>`가 주어지면 그것을, 없으면 저장소의 기본 브랜치(보통 `main`, `gh repo view --json defaultBranchRef`로 확인 가능)를 사용한다.
- 현재 브랜치가 base 브랜치와 같으면, PR을 만들 새 브랜치가 없다는 뜻이다. 사용자에게 알리고 종료한다(base 위에서 직접 작업 중이라면 새 브랜치 생성 여부를 먼저 물어봐도 된다).
- `git status`로 커밋되지 않은 변경(staged/unstaged/untracked)이 있는지 확인한다.
  - 있으면 **임의로 커밋하지 않는다.** 사용자에게 다음을 물어본다: (a) 지금 커밋하고 진행, (b) 커밋 없이 이미 커밋된 부분만으로 PR 생성, (c) 중단. 커밋을 선택하면 저장소의 커밋 컨벤션(이 저장소에 `commit` 스킬이 있으면 그 컨벤션)을 따라 커밋한다.
- `git log <base>..HEAD --oneline`으로 base 대비 커밋이 하나도 없으면(커밋되지 않은 변경도 없다면) PR로 만들 내용이 없다는 뜻이므로 사용자에게 알리고 종료한다.

### Step 2: PR 제목·본문 작성 근거 수집

- `git log <base>..HEAD`로 커밋 히스토리 전체를, `git diff <base>...HEAD`로 실제 코드 변경을 확인한다. **최신 커밋 하나만 보지 말고 base에서 갈라진 이후의 모든 커밋을 본다.**
- 커밋 메시지와 diff에서 확인되지 않는 내용(추측성 효과, 성능 수치 등)은 본문에 쓰지 않는다.

### Step 3: 원격 push 확인

- 현재 브랜치가 원격에 존재하는지, 로컬과 동기화되어 있는지 확인한다(`git status -sb` 또는 `git rev-parse --abbrev-ref --symbolic-full-name @{u}` 실패 여부로 판단).
- 원격에 없거나 로컬이 앞서 있으면, **push는 공유 상태에 영향을 주는 작업이므로 자동으로 실행하지 않고** 사용자에게 push 여부를 확인한 뒤 진행한다.
- 이미 push되어 최신 상태면 이 단계는 건너뛴다.

### Step 4: 기존 PR 확인

- `gh pr list --head <현재브랜치> --state open` (또는 `gh pr view` 실패 여부)로 현재 브랜치에 이미 열린 PR이 있는지 확인한다.
- 있으면 **새로 만들지 않고** 기존 PR 번호·제목·URL을 사용자에게 안내하고 종료한다.

### Step 5: PR 본문 템플릿 선택

본문은 두 언어 템플릿 중 하나를 골라 작성한다. **기본값은 한국어 템플릿**이며, 저장소가 **영어 기반 오픈소스 프로젝트**라는 신호가 뚜렷할 때만 영어 템플릿으로 전환한다.

- `references/pr_template_ko.md` — 기본 템플릿. 판단이 애매하면 이쪽을 쓴다.
- `references/pr_template_en.md` — 영어 기반 오픈소스 프로젝트용 템플릿.

전환 여부는 다음 신호를 확인해서 판단한다(하나라도 뚜렷하면 영어 템플릿):

- `README.md`, `CONTRIBUTING.md`가 영어로 작성되어 있다.
- `.github/PULL_REQUEST_TEMPLATE.md`가 이미 있고 영어로 작성되어 있다(있다면 그 기존 템플릿의 섹션 구조를 존중하되, 최소한 Summary/Test plan에 해당하는 내용은 채운다).
- 기존 커밋 메시지·이슈·PR 히스토리가 영어 위주다(`git log --oneline -20`, `gh pr list`, `gh issue list`로 확인).
- `gh repo view --json isPrivate,owner`로 공개(public) 저장소이고, 국제적인 기여자를 대상으로 하는 정황이 보인다.

이 저장소(react-component-generator-main)처럼 문서·커밋이 한국어인 프로젝트는 기본값(한국어 템플릿)을 그대로 쓴다. 신호가 섞여 있어 애매하면 사용자에게 묻기보다 기본값(한국어)을 우선한다.

### Step 6: PR 생성

- 제목: 70자 이내, "무엇을 왜" 관점으로 간결하게. 커밋이 하나면 그 커밋 메시지를 기반으로, 여러 개면 전체를 아우르는 요약으로 작성한다. 영어 템플릿을 쓰기로 했으면 제목도 영어로 작성한다.
- 본문: Step 5에서 고른 템플릿 파일을 읽고, 그 구조와 작성 규칙을 따라 실제 diff·커밋 히스토리에 근거해 채운다. 템플릿에 없는 내용(추측성 효과, 성능 수치 등)은 지어내지 않는다.
- 본문 마지막에는 이 대화의 system-reminder에 명시된 attribution 라인을 그대로 포함한다(템플릿 파일 자체에는 attribution이 들어있지 않으므로 이 단계에서 직접 덧붙인다).
- `--draft` 인자가 주어졌으면 `gh pr create --draft`로, 아니면 일반 PR로 생성한다. `--base <branch>`가 주어졌으면 `gh pr create --base <branch>`로 지정한다.
- `gh pr create --title "..." --body "$(cat <<'EOF' ... EOF)"` 형태로 HEREDOC을 사용해 본문 포매팅이 깨지지 않게 한다.

### Step 7: 결과 보고

- 생성된 PR URL을 사용자에게 보여준다.
- `gh pr create`가 실패하면(권한 부족, base 브랜치 없음 등) 에러 메시지를 그대로 전달하고, 원인을 파악해 어떻게 대응할지 사용자에게 안내한다. 임의로 재시도하거나 다른 브랜치로 우회하지 않는다.

## 금지 사항

- 사용자 확인 없이 커밋하거나 push하지 않는다.
- 원격에 이미 열린 PR이 있는데 중복 PR을 만들지 않는다.
- diff·커밋 히스토리에서 확인되지 않는 내용(테스트 결과, 성능 개선 수치 등)을 본문에 지어내지 않는다.
- `git push --force`, `git commit --amend`, `--no-verify` 등은 사용자가 명시적으로 요청하지 않는 한 사용하지 않는다.
