import autoprefixer from "autoprefixer";
import stripComments from "postcss-strip-comments"

export default context => {
    return {
        map: {
            inline: false,
            annotation: true,
            sourcesContent: true
        },
        plugins: [
            //移除所有的注释
            stripComments(),
            autoprefixer({
                //禁用级联效果(厂商前缀对齐)
                cascade: false
            })
        ],
    }
};


