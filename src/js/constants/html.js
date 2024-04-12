import icons from './icons'
import key from './key'

export default {
  // 容器
  container: [`<div class="codepencil">`, '</div>'],
  //头部
  header: [`<ul class="header">`, `</ul>`],
  //头部按钮
  headerItem: `<li>%s</li>`,

  //头部的按钮
  headerItemButton: `<button %s class="%s">%s</button>`,

  //头部的开关
  headerItemswitch: `<label for="%s"><input  type="checkbox" class="switch" id="%s" %s>%s</label>`,

  //身体结构
  body: [`<div class="body">`, `</div>`],

  //面板
  panel: `<div class="panel %s" ${key.attribute.dataId}="%s">
  <div class="panel-header">
      <div class="title">%s</div>
      <div class="actions">
          <button type="button" class="%s-clear-btn">
          ${icons.clear}
          </button>
      </div>
  </div>
  <div class="panel-body">
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

  // 遮罩层
  overlays: `<div class="overlays"><div class="loader"></div></div>`,
}
