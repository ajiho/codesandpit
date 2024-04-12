#  Options

## html

- **Type:** `string`
- **Default:** `''`

**Example:**

```js
new Codesandpit(element, {
    html:`<button type="button" class="btn btn-primary">Primary</button>`
})
```

## css

- **Type:** `string`
- **Default:** `''`

## js

- **Type:** `string`
- **Default:** `''`

## height

- **Type:** `string|undefined`
- **Default:** `undefined`

设置编辑器的高度,例如:`400px`

## autoRunChecked

- **Type:** `boolean`
- **Default:** `true`


自动运行开关的默认状态

## autoRunLabel

- **Type:** `string`
- **Default:** `自动运行`

自动运行的Label文本

## multipleChoiceChecked

- **Type:** `boolean`
- **Default:** `true`

多选开关默认状态

## multipleChoiceLabel

- **Type:** `string`
- **Default:** `多选面板`

多选开关的Label文本




## paths.css


- **Type:** `string[]`
- **Default:** `[]`

**Example:**

```js
new Codesandpit(element, {
    paths:{
        css:[
            // 'bootstrap.min.css'
            'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
            './your.css',
        ]
    }
})
```


## paths.js

- **Type:** `string[]`
- **Default:** `[]`

## runAway

- **Type:** `boolean`
- **Default:** `false`

初始化后立即运行示例

## active

- **Type:** `string[]`
- **Default:** `['html', 'result']`

初始化时默认激活的Tab


## breakpoint

- **Type:** `number`
- **Default:** `576`

当初始化元素的父元素的宽度大于该值则会同时显示选项`active`所设定的值,小于该宽度则默认只显示想要激活的第一个Tab

:::warning 

注意，小于该宽度时和大于该宽度时的激活状态时相互独立的

:::




## htmlButtonText

- **Type:** `string`
- **Default:** `html`


html选项卡按钮的文本字符串



## htmlPanelHeaderTitle

- **Type:** `string`
- **Default:** `html`


html面板标题


## cssButtonText

- **Type:** `string`
- **Default:** `css`


css选项卡按钮的文本字符串


## cssPanelHeaderTitle

- **Type:** `string`
- **Default:** `css`


css面板标题


## javascriptButtonText

- **Type:** `string`
- **Default:** `javascript`


javascript选项卡按钮的文本字符串



## javascriptPanelHeaderTitle

- **Type:** `string`
- **Default:** `javascript`


javascript面板标题


## resultButtonText

- **Type:** `string`
- **Default:** `结果`


结果选项卡按钮的文本字符串


## resultPanelHeaderTitle

- **Type:** `string`
- **Default:** `结果`


结果面板标题

## consoleButtonText

- **Type:** `string`
- **Default:** `控制台`


控制台选项卡按钮的文本字符串


## consolePanelHeaderTitle

- **Type:** `string`
- **Default:** `控制台`


控制台面板标题







