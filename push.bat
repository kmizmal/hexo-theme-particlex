@echo off
REM 主题子模块推送脚本（请在 themes/particlex 目录下运行，仅影响主题子模块）
REM 注意：本脚本提交/推送的是【当前目录所在仓库】。如需更新父仓库对主题的引用，请在父仓库单独操作。

git rev-parse --show-toplevel
echo.
echo [预览] 以下改动将被提交到主题子模块：
git status --short
echo.
set /p CONFIRM=确认提交并推送到主题远程？ (输入 yes 继续):
if not "%CONFIRM%"=="yes" (
  echo 已取消，未做任何改动。
  exit /b 1
)

git add -A
git commit -m "chore(theme): optimize"
git push
echo.
echo 完成。
