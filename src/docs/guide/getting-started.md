# 入门



## 安装


### CDN


```html
<link rel="stylesheet" href="https://unpkg.com/codesandpit@latest/dist/css/codesandpit.min.css"/>
<script src="https://unpkg.com/codesandpit@latest/dist/js/codesandpit.min.js"></script>
<!-- 或者 -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/codesandpit@latest/dist/css/codesandpit.min.css"/>
<script src="https://cdn.jsdelivr.net/npm/codesandpit@latest/dist/js/codesandpit.min.js"></script>
```



::: tip
如果你想锁定到特定版本，你应该更换@latest到指定版本(例如@0.0.1),您可以在[unpkg](https://unpkg.com/codesandpit@latest/dist/),[jsdelivr](https://cdn.jsdelivr.net/npm/codesandpit@latest/dist/)找到可用模块的完整列表
:::


### 本地安装

::: code-group

```sh [npm]
$ npm add -D codesandpit
```

```sh [pnpm]
$ pnpm add -D codesandpit
```

```sh [yarn]
$ yarn add -D codesandpit
```

```sh [bun]
$ bun add -D codesandpit
```

:::

> npm add和npm install(npm i)等效、npm add是npm@7.0.0引入

## 使用


```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link rel="stylesheet" href="https://unpkg.com/codesandpit@latest/dist/css/codesandpit.min.css"/>
</head>

<body>
    <!-- 准备一个dom元素 -->
    <div id="demo"></div>

    <script src="https://unpkg.com/codesandpit@latest/dist/js/codesandpit.min.js"></script>
    <script>
        //最基本的示例
        new Codesandpit(document.querySelector('#demo'), {
            height: 300,
            //外部css和js的路径,可以是cdn也可以是本地的相对路径
            paths: {
                css: [
                    // './bootstrap.min.css',
                    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
                ],
                js: [
                    //它们会按照数组的顺序依次添加
                    'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
                    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.min.js',
                ]
            },
            //html字符串
            html: `<h1>hello codesandpit!</h1> <button class="btn btn-success">点我！<\/button>`,
            //css样式
            css: 'h1{color:red}',
            //js代码
            js: `$('button').on('click',function(){$(this).after('<h2>New Heading</h2>')})`,
        });
    </script>
</body>
</html>
```

## 下一步

- 可以查看漂亮的codesandpit的 [演示效果](/examples/index).
- 查看[选项](/options/index)探索更高级的玩法.
