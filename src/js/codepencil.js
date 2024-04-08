import { oneDark } from '@codemirror/theme-one-dark'
import { indentWithTab, defaultKeymap } from "@codemirror/commands";
import { basicSetup } from "codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { autocompletion } from "@codemirror/autocomplete";
import { json } from "@codemirror/lang-json";
import { emmetConfig, expandAbbreviation, abbreviationTracker } from '@emmetio/codemirror6-plugin';

import {
    OverlayScrollbars,
    ScrollbarsHidingPlugin,
    SizeObserverPlugin,
    ClickScrollPlugin
} from 'overlayscrollbars';
import { lock, unlock } from 'tua-body-scroll-lock'


import { Helper, Vent, u } from "./utils";
import Constants from "./constants";


const DEFAULT = {
    //外部css和js的路径
    paths: {
        css: [],
        js: []
    },
    //高度
    height: undefined,
    //多选
    multiple: true,
    //初始化后立马运行
    runAway: false,
    //自动运行
    autoRun: false,
    //html css js result console 其中之一
    active: ['html', 'result'],
    //断点视口
    breakpoint: 576,
    //html字符串
    html: '',
    //css样式
    css: '',
    //js代码
    js: '',
}



class Codepencil {

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
    //自动运行的复选框
    #autoRunCheckboxEl
    #cssEditor
    #htmlEditor
    #jsEditor
    #consoleEditor

    #cssEditorEl
    #htmlEditorEl
    #jsEditorEl
    #consoleEditorEl
    #outputLoaderWraperEl

    #documentWriteDebounce
    #iframePanelEl




    constructor(element, options) {

        this.#element = element;
        this.#options = Helper.extend({}, DEFAULT, options);

        //隐藏元素
        this.#element.style.setProperty('display', 'none')
        this.#parentContainer = this.#element.parentNode;

        this.#init();

    }


    #init() {
        //布局
        this.#container();

        //响应式逻辑
        this.#responsive();

        //代码编辑器初始化
        this.#editorInit();

        //滚动条美化
        this.#scrollbar();

        //点击事件
        this.#event()


        if (this.#options.runAway === true) { //是否立马运行
            this.#run();
        }

    }


    #scrollbar() {

        //插件注册
        OverlayScrollbars.plugin([SizeObserverPlugin, ClickScrollPlugin, ScrollbarsHidingPlugin]);

        [this.#htmlEditor.dom, this.#cssEditor.dom, this.#jsEditor.dom, this.#consoleEditor.dom].forEach(element => {
            const osBodyInstance = OverlayScrollbars({
                target: element,
                elements: {
                    viewport: element.querySelector('.cm-scroller'),
                },
            }, {
                scrollbars: {
                    //never scroll leave move
                    autoHide: 'leave',
                    //是否可以点击轨道滚动
                    clickScroll: true,
                    //隐藏滚动条的时间
                    autoHideDelay: 800,
                }
            });
        })
    }

    #event() {

        const that = this;
        const v_containerEl = new Vent(this.#containerEl)

        //父级页面监听子页面传递的数据
        window.addEventListener('message', (event) => {

            const data = event.data

            const typ = data.typ


            if (typ === "console") {

                const prop = data.prop
                const message = data.message

                const info = JSON.stringify(message, null, '\t')


                this.#consoleEditor.dispatch({
                    changes: {
                        from: 0,
                        to: this.#consoleEditor.state.doc.length,
                        insert: this.#consoleEditor.state.doc.toString() + info + '\n'
                    }
                })

                this.#consoleEditor.scrollDOM.scrollTop = this.#consoleEditor.contentHeight;

            } else if (typ === "ready") {//关闭遮罩层
                //延迟500毫秒再移除，避免白色闪烁

                setTimeout(() => {
                    this.#outputLoaderWraperEl.classList.remove('open')
                }, 500)
            }
        });



        //立即运行按钮处理
        v_containerEl.on('click', '.run-btn', function () {
            that.#run()
        })

        //清空全部处理
        v_containerEl.on('click', '.clear-btn', function () {
            that.#clear();
        })

        //全屏处理
        v_containerEl.on('click', '.fullscreen-btn', function () {
            that.#fullscreen();
        })


        //清理html
        v_containerEl.on('click', '.html-clear-btn', function () {
            that.#clearHtml();
        })

        v_containerEl.on('click', '.css-clear-btn', function () {
            that.#clearCss();
        })

        v_containerEl.on('click', '.js-clear-btn', function () {
            that.#clearJs();
        })

        v_containerEl.on('click', '.result-clear-btn', function () {
            // that.#clear
            that.#clearResult();
        })

        v_containerEl.on('click', '.console-clear-btn', function () {
            that.#clearConsole();
        })


    }

    //全屏处理逻辑
    #fullscreen() {

        const u_container = u(this.#containerEl)
        const fullscreenClass = "fullscreen"

        const u_fullscreenBtn = u('.fullscreen-btn')

        if (u_container.hasClass(fullscreenClass)) {//退出全屏
            u_container.removeClass(fullscreenClass);

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

        this.#clearHtml();
        this.#clearCss();
        this.#clearJs();
        this.#clearConsole();
        this.#clearResult();

    }


    //清理结果
    #clearResult() {
        this.#iframePanelEl.querySelector('iframe')?.remove();
    }

    #clearHtml() {
        this.#editorClear(this.#htmlEditor);
    }

    #clearCss() {
        this.#editorClear(this.#cssEditor);
    }

    #clearJs() {
        this.#editorClear(this.#jsEditor);
    }

    #clearConsole() {
        this.#editorClear(this.#consoleEditor);
    }

    #editorClear(editor) {
        editor.dispatch({
            changes: {
                from: 0,
                to: editor.state.doc.length,
                insert: ''
            }
        })
    }


    #run() {
        this.#outputLoaderWraperEl.classList.add('open')
        this.#write();
    }


    // 处理外部的css
    #extraCss() {
        //处理外部的css
        const cssPathsTemp = [];
        this.#options.paths.css.forEach(item => {
            cssPathsTemp.push(Helper.sprintf(Constants.HTML.stylesheet, item));
        })
        return cssPathsTemp.join('');
    }


    // 处理外部的js
    #extraJs() {
        const jsPathsTemp = [];
        this.#options.paths.js.forEach(item => {
            jsPathsTemp.push(Helper.sprintf(Constants.HTML.scriptTpl, item));
        })
        return jsPathsTemp.join('');
    }

    //向iframe中写入内容
    #write() {

        //先移除iframe
        this.#iframePanelEl.querySelector('iframe')?.remove();

        //然后创建iframe
        const iframeEl = document.createElement('iframe');

        // iframeEl.onload = () => {
        //     console.log('完毕');
        //     this.#outputLoaderWraperEl.classList.remove('open')
        // }

        //插入到容器内
        this.#iframePanelEl.appendChild(iframeEl);

        const contentDocument = iframeEl.contentDocument

        //这里要准备格式化的内容
        const iframeContent = Helper.sprintf(Constants.HTML.iframeDocTemplate,
            this.#extraCss(),
            this.#cssEditor.state.doc.toString(),
            this.#htmlEditor.state.doc.toString(),
            this.#extraJs(),
            this.#jsEditor.state.doc.toString())

        contentDocument.open();
        contentDocument.write(iframeContent);
        contentDocument.close();

    }




    #editorOnInput() {


        if (this.#autoRunCheckboxEl.checked) {//自动运行被勾选则执行下面的操作
            //添加遮罩层
            this.#outputLoaderWraperEl.classList.add('open')

            this.#documentWriteDebounce();
        }
    }


    #editorInit() {


        //防抖
        this.#documentWriteDebounce = Helper.debounce(() => this.#write())




        //css编辑器
        this.#cssEditor = new EditorView({
            state: EditorState.create({
                extensions: [

                    EditorView.updateListener.of((ViewUpdate) => {
                        if (ViewUpdate.docChanged) {
                            this.#editorOnInput();
                        }
                    }),

                    basicSetup,
                    keymap.of([
                        {
                            key: 'Tab',
                            run: expandAbbreviation
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
                    //语言配置
                    css(),

                    //emmet语法的配置
                    emmetConfig.of({
                        syntax: 'css'
                    }),

                    //emmet语法生成的结构预览
                    abbreviationTracker({
                        syntax: 'css'
                    })
                ],
                // 编辑器中的内容
                doc: this.#options.css,
            }),
            // 编辑器 挂载的dom
            parent: this.#cssEditorEl,
        });


        // this.#cssEditor.dom.addEventListener("input", () => {
        //     console.log(`Content changed in Editor `);

        // });


        //html编辑器初始化
        this.#htmlEditor = new EditorView({
            state: EditorState.create({
                extensions: [

                    //事件监听
                    EditorView.updateListener.of((ViewUpdate) => {
                        if (ViewUpdate.docChanged) {
                            this.#editorOnInput();
                        }
                    }),


                    //这个是禁用滚动条
                    // EditorView.lineWrapping,
                    basicSetup,
                    keymap.of([
                        {
                            key: 'Tab',
                            run: expandAbbreviation
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
                    //语言配置
                    html(),

                    //emmet语法的配置
                    emmetConfig.of({
                        syntax: 'html'
                    }),

                    //emmet语法生成的结构预览
                    abbreviationTracker({
                        syntax: 'html'
                    })
                ],
                // 编辑器中的内容
                doc: this.#options.html,
            }),
            // 编辑器 挂载的dom
            parent: this.#htmlEditorEl,
        });


        //js编辑器初始化
        this.#jsEditor = new EditorView({
            state: EditorState.create({
                extensions: [
                    //事件监听
                    EditorView.updateListener.of((ViewUpdate) => {
                        if (ViewUpdate.docChanged) {
                            this.#editorOnInput();
                        }
                    }),
                    basicSetup,
                    keymap.of([
                        {
                            key: 'Tab',
                            run: expandAbbreviation
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
                    //语言配置
                    javascript(),
                ],
                // 编辑器中的内容
                doc: this.#options.js,
            }),
            // 编辑器 挂载的dom
            parent: this.#jsEditorEl,
        });

        //控制台编辑器初始化
        this.#consoleEditor = new EditorView({
            state: EditorState.create({
                extensions: [
                    basicSetup,
                    //只读模式
                    EditorView.editable.of(false),
                    json(),
                ],
                // 编辑器中的内容
                // doc: "",
            }),

            // 编辑器 挂载的dom
            parent: this.#consoleEditorEl
        });

    }

    //容器构造
    #container() {

        let html = [Constants.HTML.container[0], Constants.HTML.header[0]];

        //准备数据
        const withPanelButtons = [
            {
                id: 'html',
                text: 'HTML'
            },
            {
                id: 'css',
                text: 'CSS'
            },
            {
                id: 'js',
                text: 'Javascript'
            },
            {
                id: 'result',
                text: '结果',
            },
            {
                id: 'console',
                text: '控制台'
            },
        ];
        const buttons = [
            ...withPanelButtons,
            {
                id: '',
                text: Constants.ICONS.run,
                class: 'run-btn',
            },
            {
                id: '',
                text: Constants.ICONS.clear,
                class: 'clear-btn',
            },
            {
                id: '',
                text: Constants.ICONS.fullscreen,
                class: 'fullscreen-btn',
            }
        ]


        //激活的项目
        const activeItem = this.#isSmallDevice() ? this.#options.active.slice(0, 1) : this.#options.active;

        buttons.forEach(item => {

            if (item.id !== '') {
                let className = activeItem.includes(item.id) ? 'active' : '';
                html.push(Helper.sprintf(Constants.HTML.headerItem, Helper.sprintf(Constants.HTML.headerItemWithPanelButton, item.id, className, item.text)))

            } else {
                html.push(Helper.sprintf(Constants.HTML.headerItem, Helper.sprintf(Constants.HTML.headerItemButton, item.class, item.text)))
            }


        })



        const multipleCheckbox = Helper.sprintf(Constants.HTML.checkboxWrapper, this.#isSmallDevice() ? "" : 'show', Helper.sprintf(Constants.HTML.multipleCheckbox, this.#options.multiple ? "" : "checked"))

        //多选
        html.push(Helper.sprintf(Constants.HTML.headerItem, multipleCheckbox))


        const autoRunCheckbox = Helper.sprintf(Constants.HTML.checkboxWrapper, 'show', Helper.sprintf(Constants.HTML.autoRunCheckbox, this.#options.multiple ? "" : "checked"))

        //自动运行
        html.push(Helper.sprintf(Constants.HTML.headerItem, autoRunCheckbox))


        html.push(Constants.HTML.header[1])

        //加入面板
        html.push(Constants.HTML.body[0])



        withPanelButtons.forEach(item => {
            let className = activeItem.includes(item.id) ? 'active' : '';
            let panelBodyContent = ''
            let panelId = '';
            if (item.id === "result") {
                panelId = "iframe-panel"
                panelBodyContent = `${Constants.HTML.resultOverlays}`
            } else {
                panelBodyContent = `<div id="${item.id}Editor"></div>`
            }
            html.push(Helper.sprintf(Constants.HTML.panel, className, item.id, item.text, item.id, panelId, panelBodyContent))
        })

        html.push(Constants.HTML.header[1])
        html.push(Constants.HTML.container[1])


        html = html.join('')


        const tempElement = document.createElement('div')
        tempElement.innerHTML = html


        console.log(tempElement);
        console.log(tempElement.firstElementChild);

        // const container2 = document.createElement('div');
        // container2.innerHTML = html;
        // container2.style.setProperty('height', "100")

        // console.log(container2);


        // u(this.#element).after(u(container2))


        this.#element.insertAdjacentHTML('afterend', html)


        //查找一些dom后续使用
        this.#containerEl = document.querySelector('.codepencil')


        this.#containerEl.style.setProperty('height', '500px');



        this.#headerBtnsEl = this.#containerEl.querySelectorAll('.header button[data-id]');
        this.#panelsEl = this.#containerEl.querySelectorAll('.body .panel[data-id]');
        this.#multipleCheckboxEl = this.#containerEl.querySelector('#ckbx-style-8-1')
        this.#autoRunCheckboxEl = this.#containerEl.querySelector('#ckbx-style-8-4')
        this.#cssEditorEl = this.#containerEl.querySelector('#cssEditor')
        this.#htmlEditorEl = this.#containerEl.querySelector('#htmlEditor')
        this.#jsEditorEl = this.#containerEl.querySelector('#jsEditor')
        this.#consoleEditorEl = this.#containerEl.querySelector('#consoleEditor')
        this.#outputLoaderWraperEl = this.#containerEl.querySelector('.output-loader-wraper')
        this.#iframePanelEl = this.#containerEl.querySelector('#iframe-panel')

    }

    //响应式处理，宽度发生变化时要处理不同的逻辑
    #responsive() {
        //设置激活标志
        this.#setActivationFlag();
        //监听父元素屏幕大小变化,用于更改激活的项目
        this.#onParentResize();
        //点击逻辑处理
        this.#withPanelButtonClickHandel();
    }


    #withPanelButtonClickHandel() {
        const that = this;
        new Vent(this.#containerEl).on('click', 'button[data-id]', function () {

            const button = this;
            const u_button = u(button);
            const id = u_button.attr('data-id');

            if (that.#getParentWidth() < that.#options.breakpoint) {


                that.#responsiveActiveFlags(button, id, 'data-single-status')


            } else {


                if (that.#multipleCheckboxEl.checked) {//单选被勾选


                    that.#responsiveActiveFlags(button, id, 'data-status')



                } else {


                    if (u_button.hasClass('active')) {

                        u_button.removeClass('active');
                        delete button['data-status']

                        u(that.#panelsEl).each(function (element) {
                            if (u(element).attr('data-id') === id) {
                                u(element).removeClass('active')
                            }
                        })

                    } else {

                        u_button.addClass('active')
                        button['data-status'] = "active"



                        u(that.#panelsEl).each(function (element) {

                            if (u(element).attr('data-id') === id) {
                                u(element).addClass('active')
                            }

                        })

                    }

                }


            }

        })
    }


    #responsiveActiveFlags(button, id, attr) {

        u(this.#headerBtnsEl).each(function (element) {
            delete element[attr];
        }).removeClass('active')

        u(this.#panelsEl).removeClass('active')

        //设置小屏幕标志
        button[attr] = 'active';

        this.#activeById(id)
    }


    //判断是否是小设备 true:是  false:不是
    #isSmallDevice() {
        return this.#getParentWidth() < this.#options.breakpoint
    }




    #onParentResize() {


        const multipleCheckboxWrapper = this.#multipleCheckboxEl.parentNode.parentNode

        Helper.onResize(this.#parentContainer, () => {


            u(this.#headerBtnsEl).removeClass('active')
            u(this.#panelsEl).removeClass('active')

            if (this.#isSmallDevice()) {//小设备


                multipleCheckboxWrapper.classList.remove('show')

                //获取到第一个激活的项目的id
                const id = u(this.#headerBtnsEl).filter(function (node, i) {
                    return node['data-single-status'] === 'active';
                }).attr('data-id');


                this.#activeById(id)


            } else {//大屏幕

                //获取到大屏幕下的激活项目
                const id = [];

                u(this.#headerBtnsEl).filter(function (node, i) {
                    if (node['data-status'] === 'active') {
                        id.push(node.getAttribute('data-id'))
                    }
                })


                this.#activeById(id)

                multipleCheckboxWrapper.classList.add('show')


            }


        })
    }




    #activeById(id) {

        const ids = Array.isArray(id) ? id : [id];


        const elements = [...this.#headerBtnsEl, ...this.#panelsEl]


        elements.forEach((element) => {

            const id = element.getAttribute('data-id');
            if (ids.includes(id)) {
                element.classList.add('active')
            }
        })

    }

    #setActivationFlag() {
        //1.打上标记
        this.#headerBtnsEl.forEach(element => {

            //获取到id
            const id = element.getAttribute('data-id');


            // 小屏幕的标记
            if (id === this.#options.active[0]) {


                element['data-single-status'] = 'active'

            }

            if (this.#options.active.includes(id)) {
                element['data-status'] = 'active'
            }

        })
    }

    #getParentWidth() {
        return this.#parentContainer.getBoundingClientRect().width
    }

}


export default Codepencil