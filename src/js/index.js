import { oneDark } from '@codemirror/theme-one-dark'
import { indentWithTab, defaultKeymap } from '@codemirror/commands'
import { basicSetup } from 'codemirror'
import { EditorView, keymap } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { autocompletion } from '@codemirror/autocomplete'
import { json } from '@codemirror/lang-json'
import {
  emmetConfig,
  expandAbbreviation,
  abbreviationTracker,
} from '@emmetio/codemirror6-plugin'

import {
  OverlayScrollbars,
  ScrollbarsHidingPlugin,
  SizeObserverPlugin,
  ClickScrollPlugin,
} from 'overlayscrollbars'
import { lock, unlock } from 'tua-body-scroll-lock'
import { Helper, Vent, u } from './utils'
import Constants from './constants'

let i = 0

const DEFAULT = {
  htmlButtonText: 'html',
  htmlPanelHeaderTitle: 'html',
  cssButtonText: 'css',
  cssPanelHeaderTitle: 'css',
  javascriptButtonText: 'javascript',
  javascriptPanelHeaderTitle: 'javascript',
  resultButtonText: '结果',
  resultPanelHeaderTitle: '结果',
  consoleButtonText: '控制台',
  consolePanelHeaderTitle: '控制台',
  multipleChoiceLabel: '多选面板',
  autoRunLabel: '自动运行',
  //勾选多选面板
  multipleChoiceChecked: true,
  //勾选自动运行
  autoRunChecked: true,

  //外部css和js的路径
  paths: {
    css: [],
    js: [],
  },
  //高度
  height: undefined,
  //初始化后立马运行
  runAway: false,
  //默认激活的选项卡，html css js result console 其中之一
  active: ['html', 'result'],
  //断点视口
  breakpoint: 576,
  //html字符串
  html: '',
  //css样式字符串
  css: '',
  //js代码
  js: '',
}

class Codesandpit {
  #element
  #options
  //容器元素
  #containerEl
  //头部按钮
  #headerBtnsEl
  //面板
  #panelsEl
  //父容器元素
  #parentContainer
  //多选择的复选框
  #multipleCheckboxEl
  #multipleParentLiItem
  //自动运行的复选框
  #autoRunCheckboxEl
  //css编辑器实例
  #cssEditor
  //html编辑器实例
  #htmlEditor
  //js编辑器实例
  #jsEditor
  //控制台编辑器实例
  #consoleEditor
  //css编辑器的元素
  #cssEditorEl
  #htmlEditorEl
  #jsEditorEl
  #consoleEditorEl
  #resultPanelBodyEl
  #documentWriteDebounce
  #resultOverlaysEl

  //唯一id，用于页面需要设置id的元素
  #id

  constructor(element, options) {
    this.#element = element
    this.#options = Helper.extend({}, DEFAULT, options)

    //隐藏挂载元素
    this.#element.style.setProperty('display', 'none')
    this.#parentContainer = this.#element.parentNode

    //生成一个唯一id
    this.#id = i++

    this.#init()
  }

  #init() {
    //布局
    this.#container()

    //响应式逻辑
    this.#responsive()

    //代码编辑器初始化
    this.#editorInit()

    //滚动条美化
    this.#scrollbar()

    //点击事件
    this.#event()

    if (this.#options.runAway === true) {
      //是否立马运行
      this.#run()
    }
  }

  #scrollbar() {
    //插件注册
    OverlayScrollbars.plugin([
      SizeObserverPlugin,
      ClickScrollPlugin,
      ScrollbarsHidingPlugin,
    ])
    ;[
      this.#htmlEditor.dom,
      this.#cssEditor.dom,
      this.#jsEditor.dom,
      this.#consoleEditor.dom,
    ].forEach((element) => {
      OverlayScrollbars(
        {
          target: element,
          elements: {
            viewport: element.querySelector('.cm-scroller'),
          },
        },
        {
          scrollbars: {
            //never scroll leave move
            autoHide: 'leave',
            //是否可以点击轨道滚动
            clickScroll: true,
            //隐藏滚动条的时间
            autoHideDelay: 800,
          },
        },
      )
    })
  }

  #event() {
    const that = this
    const v_containerEl = new Vent(this.#containerEl)

    //父级页面监听子页面传递的数据
    window.addEventListener('message', (event) => {
      const data = event.data

      const typ = data.typ

      if (typ === 'console') {
        const prop = data.prop
        const message = data.message

        const info = JSON.stringify(message, null, '\t')

        this.#consoleEditor.dispatch({
          changes: {
            from: 0,
            to: this.#consoleEditor.state.doc.length,
            insert: this.#consoleEditor.state.doc.toString() + info + '\n',
          },
        })

        this.#consoleEditor.scrollDOM.scrollTop =
          this.#consoleEditor.contentHeight
      } else if (typ === 'ready') {
        //关闭遮罩层
        //延迟500毫秒再移除，避免白色闪烁

        setTimeout(() => {
          this.#hideResultOverlays()
        }, 500)
      }
    })

    //立即运行按钮处理
    v_containerEl.on('click', '.run-btn', function () {
      that.#run()
    })

    //清空全部处理
    v_containerEl.on('click', '.clear-btn', function () {
      that.#clear()
    })

    //全屏处理
    v_containerEl.on('click', '.fullscreen-btn', function () {
      that.#fullscreen()
    })

    //清理html
    v_containerEl.on('click', '.html-clear-btn', function () {
      that.#clearHtml()
    })

    v_containerEl.on('click', '.css-clear-btn', function () {
      that.#clearCss()
    })

    v_containerEl.on('click', '.js-clear-btn', function () {
      that.#clearJs()
    })

    v_containerEl.on('click', '.result-clear-btn', function () {
      // that.#clear
      that.#clearResult()
    })

    v_containerEl.on('click', '.console-clear-btn', function () {
      that.#clearConsole()
    })
  }

  //全屏处理逻辑
  #fullscreen() {
    const u_container = u(this.#containerEl)
    const fullscreenClass = 'fullscreen'

    const u_fullscreenBtn = u('.fullscreen-btn')

    if (u_container.hasClass(fullscreenClass)) {
      //退出全屏
      u_container.removeClass(fullscreenClass)

      //退出图标
      u_fullscreenBtn.html(Constants.ICONS.fullscreen)

      unlock('body')
    } else {
      u_container.addClass(fullscreenClass)
      u_fullscreenBtn.html(Constants.ICONS.exitFullscreen)
      lock('body')
    }
  }

  //清理所有的文档
  #clear() {
    this.#clearHtml()
    this.#clearCss()
    this.#clearJs()
    this.#clearConsole()
    this.#clearResult()
  }

  //清理结果
  #clearResult() {
    this.#resultPanelBodyEl.querySelector('iframe')?.remove()
  }

  #clearHtml() {
    this.#editorClear(this.#htmlEditor)
  }

  #clearCss() {
    this.#editorClear(this.#cssEditor)
  }

  #clearJs() {
    this.#editorClear(this.#jsEditor)
  }

  #clearConsole() {
    this.#editorClear(this.#consoleEditor)
  }

  #editorClear(editor) {
    editor.dispatch({
      changes: {
        from: 0,
        to: editor.state.doc.length,
        insert: '',
      },
    })
  }

  #run() {
    this.#showResultOverlays()
    this.#write()
  }

  // 处理外部的css
  #extraCss() {
    //处理外部的css
    const cssPathsTemp = []
    this.#options.paths.css.forEach((item) => {
      cssPathsTemp.push(Helper.sprintf(Constants.HTML.stylesheet, item))
    })
    return cssPathsTemp.join('')
  }

  // 处理外部的js
  #extraJs() {
    const jsPathsTemp = []
    this.#options.paths.js.forEach((item) => {
      jsPathsTemp.push(Helper.sprintf(Constants.HTML.scriptTpl, item))
    })
    return jsPathsTemp.join('')
  }

  //向iframe中写入内容
  #write() {
    //先移除iframe
    this.#resultPanelBodyEl.querySelector('iframe')?.remove()

    //然后创建iframe
    const iframeEl = document.createElement('iframe')

    //插入到容器内
    this.#resultPanelBodyEl.appendChild(iframeEl)

    const contentDocument = iframeEl.contentDocument

    //这里要准备格式化的内容
    const iframeContent = Helper.sprintf(
      Constants.HTML.iframeDocTemplate,
      this.#extraCss(),
      this.#cssEditor.state.doc.toString(),
      this.#htmlEditor.state.doc.toString(),
      this.#extraJs(),
      this.#jsEditor.state.doc.toString(),
    )

    contentDocument.open()
    contentDocument.write(iframeContent)
    contentDocument.close()
  }

  #editorInput() {
    if (this.#autoRunCheckboxEl.checked) {
      //自动运行被勾选则执行下面的操作
      //添加遮罩层
      this.#showResultOverlays()
      //写入内容
      this.#documentWriteDebounce()
    }
  }

  #showResultOverlays() {
    this.#resultOverlaysEl.classList.add(Constants.CLASS.showOverlays)
  }

  #hideResultOverlays() {
    this.#resultOverlaysEl.classList.remove(Constants.CLASS.showOverlays)
  }

  #editorInit() {
    //防抖
    this.#documentWriteDebounce = Helper.debounce(() => this.#write())

    //公共的配置
    const commonConf = [
      EditorView.updateListener.of((ViewUpdate) => {
        if (ViewUpdate.docChanged) {
          this.#editorInput()
        }
      }),
      basicSetup,
      keymap.of([
        {
          key: 'Tab',
          run: expandAbbreviation,
        },
        //默认热键
        defaultKeymap,
        //支持tab按键
        indentWithTab,
      ]),
      //主题
      oneDark,
      //自动完成
      autocompletion(),
    ]

    //css编辑器
    this.#cssEditor = new EditorView({
      state: EditorState.create({
        extensions: [
          ...commonConf,
          //语言配置
          css(),
          //emmet语法的配置
          emmetConfig.of({
            syntax: 'css',
          }),
          //emmet语法生成的结构预览
          abbreviationTracker({
            syntax: 'css',
          }),
        ],
        // 编辑器中的内容
        doc: this.#options.css,
      }),
      // 编辑器 挂载的dom
      parent: this.#cssEditorEl,
    })

    //html编辑器初始化
    this.#htmlEditor = new EditorView({
      state: EditorState.create({
        extensions: [
          ...commonConf,
          //语言配置
          html(),

          //emmet语法的配置
          emmetConfig.of({
            syntax: 'html',
          }),

          //emmet语法生成的结构预览
          abbreviationTracker({
            syntax: 'html',
          }),
        ],
        // 编辑器中的内容
        doc: this.#options.html,
      }),
      // 编辑器 挂载的dom
      parent: this.#htmlEditorEl,
    })

    //js编辑器初始化
    this.#jsEditor = new EditorView({
      state: EditorState.create({
        extensions: [
          ...commonConf,
          //语言配置
          javascript(),
        ],
        // 编辑器中的内容
        doc: this.#options.js,
      }),
      // 编辑器 挂载的dom
      parent: this.#jsEditorEl,
    })

    //控制台编辑器初始化
    this.#consoleEditor = new EditorView({
      state: EditorState.create({
        extensions: [
          basicSetup,
          //只读模式
          EditorView.editable.of(false),
          json(),
        ],
      }),
      // 编辑器 挂载的dom
      parent: this.#consoleEditorEl,
    })
  }

  //容器构造
  #container() {
    let html = [Constants.HTML.container[0], Constants.HTML.header[0]]

    let multipleId = `multiple${this.#id}`
    let autoRunId = `autoRun${this.#id}`

    //准备数据
    const withPanelButtons = [
      {
        id: 'html',
        text: this.#options.htmlButtonText,
        panelHeaderTitle: this.#options.htmlPanelHeaderTitle,
      },
      {
        id: 'css',
        text: this.#options.cssButtonText,
        panelHeaderTitle: this.#options.cssPanelHeaderTitle,
      },
      {
        id: 'js',
        text: this.#options.javascriptButtonText,
        panelHeaderTitle: this.#options.javascriptPanelHeaderTitle,
      },
      {
        id: 'result',
        text: this.#options.resultButtonText,
        panelHeaderTitle: this.#options.resultPanelHeaderTitle,
      },
      {
        id: 'console',
        text: this.#options.consoleButtonText,
        panelHeaderTitle: this.#options.consolePanelHeaderTitle,
      },
    ]

    const buttons = [
      ...withPanelButtons,
      {
        text: Constants.ICONS.run,
        class: Constants.CLASS.runBtn,
      },
      {
        text: Constants.ICONS.clear,
        class: Constants.CLASS.clearBtn,
      },
      {
        text: Constants.ICONS.fullscreen,
        class: Constants.CLASS.fullscreenBtn,
      },
    ]

    const switchs = [
      {
        id: multipleId,
        checked: this.#options.multipleChoiceChecked ? 'checked' : '',
        label: this.#options.multipleChoiceLabel,
      },
      {
        id: autoRunId,
        checked: this.#options.autoRunChecked ? 'checked' : '',
        label: this.#options.autoRunLabel,
      },
    ]

    //计算得到需要激活的项目
    const activeItem = this.#isSmallDevice()
      ? this.#options.active.slice(0, 1)
      : this.#options.active

    buttons.forEach((item) => {
      let id = ''
      let className = ''
      if (item.id !== undefined) {
        //如果有id属性的
        id = `${Constants.KEY.attribute.dataId}=${item.id}`
        className =
          activeItem.includes(item.id) && Constants.CLASS.headItemActive
      } else if (item.class !== undefined) {
        //有类的名的
        className = item.class
      }
      html.push(
        Helper.sprintf(
          Constants.HTML.headerItem,
          Helper.sprintf(
            Constants.HTML.headerItemButton,
            id,
            className,
            item.text,
          ),
        ),
      )
    })

    switchs.forEach((item) => {
      let htmlStr = Helper.sprintf(
        Constants.HTML.headerItem,
        Helper.sprintf(
          Constants.HTML.headerItemswitch,
          item.id,
          item.id,
          item.checked,
          item.label,
        ),
      )

      if (item.id.startsWith('multiple') && this.#isSmallDevice()) {
        //如果是多选面板要根据视口大小设置显示和隐藏
        htmlStr = Helper.setProperty(htmlStr, 'display', 'none')
      }
      html.push(htmlStr)
    })

    html.push(Constants.HTML.header[1])

    //加入面板
    html.push(Constants.HTML.body[0])

    withPanelButtons.forEach((item) => {
      //激活的类名
      let className = activeItem.includes(item.id)
        ? Constants.CLASS.panelActive
        : ''

      //内容
      let panelBodyContent = ''
      if (item.id === 'result') {
        panelBodyContent = `${Constants.HTML.overlays}`
      } else {
        panelBodyContent = `<div id="${item.id}Editor"></div>`
      }

      html.push(
        Helper.sprintf(
          Constants.HTML.panel,
          className,
          item.id,
          item.text,
          item.id,
          panelBodyContent,
        ),
      )
    })

    html.push(Constants.HTML.header[1])
    html.push(Constants.HTML.container[1])

    html = html.join('')

    //设置高度
    html = Helper.setProperty(html, 'height', this.#options.height)

    //插入到挂载元素的后面
    this.#element.insertAdjacentHTML('afterend', html)

    //查找一些dom后续使用
    this.#containerEl = this.#element.nextElementSibling
    this.#headerBtnsEl = this.#containerEl.querySelectorAll(
      `.header button[${Constants.KEY.attribute.dataId}]`,
    )
    this.#panelsEl = this.#containerEl.querySelectorAll(
      `.body .panel[${Constants.KEY.attribute.dataId}]`,
    )
    this.#multipleCheckboxEl = this.#containerEl.querySelector(`#${multipleId}`)

    //多选开关的父级容器的li元素
    this.#multipleParentLiItem = this.#multipleCheckboxEl.parentNode.parentNode
    this.#autoRunCheckboxEl = this.#containerEl.querySelector(`#${autoRunId}`)

    this.#htmlEditorEl = this.#containerEl.querySelector('#htmlEditor')
    this.#cssEditorEl = this.#containerEl.querySelector('#cssEditor')
    this.#jsEditorEl = this.#containerEl.querySelector('#jsEditor')
    this.#consoleEditorEl = this.#containerEl.querySelector('#consoleEditor')

    //结果的面板
    this.#resultPanelBodyEl = this.#containerEl.querySelector(
      `.panel[${Constants.KEY.attribute.dataId}="result"] .panel-body`,
    )

    //遮罩层
    this.#resultOverlaysEl = this.#resultPanelBodyEl.querySelector('.overlays')
  }

  //响应式处理，宽度发生变化时要处理不同的逻辑
  #responsive() {
    //设置响应式属性
    this.#setResponsiveProp()
    //监听父元素屏幕大小变化,用于更改激活的项目
    this.#resize()
    //点击逻辑处理
    this.#withPanelButtonClickHandel()
  }

  #withPanelButtonClickHandel() {
    const that = this
    new Vent(this.#containerEl).on(
      'click',
      `button[${Constants.KEY.attribute.dataId}]`,
      function () {
        const button = this
        const u_button = u(button)
        const id = u_button.attr(Constants.KEY.attribute.dataId)

        if (that.#getParentWidth() < that.#options.breakpoint) {
          that.#responsiveActiveFlags(
            button,
            id,
            Constants.KEY.prop.singleStatus,
          )
        } else {
          if (that.#multipleCheckboxEl.checked) {
            //单选被勾选

            if (u_button.hasClass(Constants.CLASS.headItemActive)) {
              u_button.removeClass(Constants.CLASS.headItemActive)
              delete button[Constants.KEY.prop.status]

              u(that.#panelsEl).each(function (element) {
                if (u(element).attr(Constants.KEY.attribute.dataId) === id) {
                  u(element).removeClass(Constants.CLASS.headItemActive)
                }
              })
            } else {
              u_button.addClass(Constants.CLASS.headItemActive)
              button[Constants.KEY.prop.status] = Constants.CLASS.headItemActive

              u(that.#panelsEl).each(function (element) {
                if (u(element).attr(Constants.KEY.attribute.dataId) === id) {
                  u(element).addClass(Constants.CLASS.headItemActive)
                }
              })
            }
          } else {
            that.#responsiveActiveFlags(button, id, Constants.KEY.prop.status)
          }
        }
      },
    )
  }

  #responsiveActiveFlags(button, id, attr) {
    u(this.#headerBtnsEl)
      .each(function (element) {
        delete element[attr]
      })
      .removeClass(Constants.CLASS.headItemActive)
    u(this.#panelsEl).removeClass(Constants.CLASS.headItemActive)
    //设置小屏幕标志
    button[attr] = Constants.CLASS.headItemActive
    this.#activeById(id)
  }

  //判断是否是小设备 true:是  false:不是
  #isSmallDevice() {
    return this.#getParentWidth() < this.#options.breakpoint
  }

  // 大小改变的事件
  #resize() {
    Helper.onResize(this.#parentContainer, () => {
      //头部和面板移除所有的激活项目
      u(this.#headerBtnsEl).removeClass(Constants.CLASS.headItemActive)
      u(this.#panelsEl).removeClass(Constants.CLASS.panelActive)

      if (this.#isSmallDevice()) {
        //小设备

        this.#multipleParentLiItem.style.setProperty('display', 'none')

        //获取到第一个激活的项目的id
        const id = u(this.#headerBtnsEl)
          .filter(function (node, i) {
            return (
              node[Constants.KEY.prop.singleStatus] ===
              Constants.CLASS.headItemActive
            )
          })
          .attr(Constants.KEY.attribute.dataId)

        this.#activeById(id)
      } else {
        //大屏幕

        //获取到大屏幕下的激活项目
        const id = []

        u(this.#headerBtnsEl).filter(function (node, i) {
          if (
            node[Constants.KEY.prop.status] === Constants.CLASS.headItemActive
          ) {
            id.push(node.getAttribute(Constants.KEY.attribute.dataId))
          }
        })

        this.#activeById(id)
        this.#multipleParentLiItem.style.setProperty('display', null)
      }
    })
  }

  #activeById(id) {
    const ids = Array.isArray(id) ? id : [id]

    const elements = [...this.#headerBtnsEl, ...this.#panelsEl]

    elements.forEach((element) => {
      const id = element.getAttribute(Constants.KEY.attribute.dataId)
      if (ids.includes(id)) {
        element.classList.add(Constants.CLASS.headItemActive)
      }
    })
  }

  #setResponsiveProp() {
    //1.打上标记
    this.#headerBtnsEl.forEach((element) => {
      //获取到id
      const id = element.getAttribute(Constants.KEY.attribute.dataId)

      // 小屏幕的标记
      if (id === this.#options.active[0]) {
        element[Constants.KEY.prop.singleStatus] =
          Constants.CLASS.headItemActive
      }
      if (this.#options.active.includes(id)) {
        element[Constants.KEY.prop.status] = Constants.CLASS.headItemActive
      }
    })
  }

  #getParentWidth() {
    return this.#parentContainer.getBoundingClientRect().width
  }
}

export default Codesandpit
