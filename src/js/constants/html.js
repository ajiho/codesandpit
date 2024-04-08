export default {
  // 容器
  container: [`<div class="codepencil">`, '</div>'],
  //头部
  header: [`<ul class="header">`, `</ul>`],
  //头部按钮
  headerItem: `<li>%s</li>`,
  //头部的按钮
  headerItemWithPanelButton: `<button data-id="%s" class="%s">%s</button>`,
  headerItemButton: `<button class="%s">%s</button>`,

  //选择框容器
  checkboxWrapper: `<div class="checkbox-wrapper %s">%s</div>`,

  //多选开关
  multipleCheckbox: `<div class="ckbx-style-8">
  <input type="checkbox" id="ckbx-style-8-1" %s>
  <label for="ckbx-style-8-1"></label>
</div>
<div class="multiple-label">单选</div>`,

  //自动运行的复选框
  autoRunCheckbox: `<div class="ckbx-style-8">
  <input type="checkbox" id="ckbx-style-8-4" %s>
  <label for="ckbx-style-8-4"></label>
</div>
<div class="multiple-label">自动运行</div>`,

  //身体结构
  body: [`<div class="body">`, `</div>`],

  //面板
  panel: `<div class="panel %s" data-id="%s">
  <div class="panel-header">
      <div class="title">%s</div>
      <div class="actions">
          <button type="button" class="%s-clear-btn">
              <svg viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                  <path
                      d="M11.354 4.646a.5.5 0 0 0-.708 0l-6 6a.5.5 0 0 0 .708.708l6-6a.5.5 0 0 0 0-.708z" />
              </svg>
          </button>
      </div>
  </div>
  <div class="panel-body" id="%s">
  %s
  </div>
</div>`,
  stylesheet: `<link rel="stylesheet" href="%s">`,
  scriptTpl: `<script src="%s"></script>`,
  iframeDocTemplate: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
%s
<title>Document</title>
<style>
%s
</style>
</head>
<body>
%s
%s
<script>
(function(){
  const searchParams = new URLSearchParams(location.search);
  const ready = () => {
    window.parent.postMessage(
      {
        typ: "ready",
        prop: Object.fromEntries(searchParams.entries()),
      },
      "*"
    );
  };
  window.addEventListener("DOMContentLoaded", ready); 
  window.console = new Proxy(console, {
    get(target, prop) {
        if (prop === "log" || prop === "error" || prop === "warn") {
            return (...args) => {
                const message = args.join(" ");
                window.parent.postMessage({ typ: "console", prop, message }, "*");
                target[prop](...args);
            };
        }
        return target[prop];
    },
  });
})();
%s
</script>
</body>
</html>`,
  resultOverlays: `<div class="output-loader-wraper">
  <div style="color: #a0cadb" class="la-ball-clip-rotate-pulse">
      <div></div>
      <div></div>
  </div>
</div>`


}
