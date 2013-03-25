#SeaJS AOP Plugin

[SeaJS](https://github.com/seajs/seajs)的AOP插件，提供了1.3.x和2.0.0版本，能够拦截到配置中指定的模块中的方法。2.0.0版本使用了提供的define事件来实现对factory函数的拦截，老版本中是modify了全局的define函数

###配置

    seajs.config({
		aspect : [{
			// Module path must be relative to basePath of sea.js
			"module" : "xxx/xxxx",
			// Use regex test to uri when fuzzy is set true
			"fuzzy" : true,
		    "methods" : [{
				"path" : "xxxx.xxx",
				// advices
				// can be array or functions
			    "after" : function(){},
			    "before" : function(){}
		    }]
	    }]
    })