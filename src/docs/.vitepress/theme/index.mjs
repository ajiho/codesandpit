// .vitepress/theme/index.js
import DefaultTheme from 'vitepress/theme'
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'


import './custom.scss'




export default {
    ...DefaultTheme,
    enhanceApp({ app }) {
        enhanceAppWithTabs(app)
        //注册自己的全局组件
    }
}
