<script setup>

import { ref, onMounted } from "vue";

import "../../../../dist/css/codesandpit.css";



const props = defineProps({
    text: {
        type: String,
        default: '🚀运行示例'
    },
    refreshText: {
        type: String,
        default: '刷新'
    },
    closeText: {
        type: String,
        default: '关闭'
    },
    title: {
        type: String,
        default: ''
    },
    src: {
        type: String,
        default: ''
    }
})





const codepen = ref(null);

onMounted(() => {
    import('../../../../dist/js/codesandpit.esm').then((module) => {
        new module.default(codepen.value, {
            height: '600px',
            runAway: true,
            multiple: true,
            paths: {
                css: [
                    // './bootstrap.min.css',
                    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
                ],
                js: [
                    //它们会按照数组的顺序依次添加
                    'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
                    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.min.js',
                ],
            },
            //html字符串
            html: `<h1>hello codesandpit!</h1><button class="btn btn-success">点我！<\/button>`,
            //css样式
            css: 'h1{color:red}',
            //js代码
            js: `$('button').on('click',function(){$(this).after('<h2>New Heading</h2>')})`,
        })
    })
})


</script>


<template>
    <div ref="codepen"></div>
</template>

<style>
/* 覆盖vitepress的样式 */
.vp-doc.container {
    padding: 0;
    max-width: 100%;
}
</style>
