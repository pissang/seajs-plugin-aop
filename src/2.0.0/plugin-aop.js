(function(seajs){

	// examples
	// seajs.config({
	//   aspect : [{
	//	   // Module path must be relative to basePath of sea.js
	//	   "module" : "xxx/xxxx",
	//     // Use regex test to uri when fuzzy is set true
	//     "fuzzy" : true,
	//	   "methods" : [{
	//		  "path" : "xxxx.xxx",
	//        // advices
	///		  // can be array or functions
	//        "after" : function(){},
	//        "before" : function(){}
	//     }]
	//   }]
	//
	var configData = seajs.config.data,
		extraConfigData = [];

	seajs.on("define", function(data){

		var origFactory = data.factory;

		var newFactory = function(require, exports, module){
			var exports = typeof(origFactory) === "function" ?
						origFactory.call(this, require, exports, module) :
						factory;

			exports = exports === undefined ? module.exports : exports;

			var aspects = (configData.aspect || []).concat(extraConfigData);

			_each(aspects, function(item){
				if( _match(item.module, module.uri, item.fuzzy) ){
					_each(item.methods, function(method){
						method.before &&
							_aspect(exports, method.path, "before", method.before);
						method.after &&
							_aspect(exports, method.path, "after", method.after);
					})
				}
			})

			return exports;
		}

		data.factory = newFactory;
	})

	_each(configData.aspect, function(item){
		_each(item.methods, function(method){
			method.before && 
				_findInCache(item.module, item.path, "before", method.before, item.fuzzy);
			method.after &&
				_findInCache(item.module, item.path, "after", method.after, item.fuzzy);
		});
	})	

	function _findInCache(uriPattern, path, advice, handler, fuzzy){
		for(var uri in seajs.cache){
			var module = seajs.cache[uri];
			if( _match(uriPattern, uri, fuzzy) ){
				_aspect( module, path, advice, handler );
			}
		}
	}

	function _match(uriPattern, uri, fuzzy){
		return fuzzy ? 
				(new RegExp(uriPattern)).test(uri)
				: seajs.resolve(uriPattern, configData.base) === uri;
	}

	function _each(arr, iterator, context){
		if( !(arr && iterator) ){
			return;
		}
		if(arr.forEach){
			return arr.forEach( iterator.bind(context) );
		}
		for(var i =0; i < arr.length; i++){
			iterator.call( context, memo, arr[i])
		}
	}

	function _reduce(arr, iterator, memo, context){
		if( ! arr){
			return memo;
		}
		if( arr.reduce ){
			return arr.reduce( iterator.bind(context), memo );
		}
		for(var i = 0; i < arr.length; i++){
			memo = iterator.call( context, memo, arr[i], i);
		}
		return memo;
	}

	function _aspect(module, path, advice, handlers){
		var pathSplitted = path.split("."),
			methodName = pathSplitted.pop();

		var target = _reduce(pathSplitted, function(memo, key){
			if( memo ){
				return memo[key];
			}
		}, module);

		if( target ){
			var origMethod = target[methodName];
		}
		if( typeof(origMethod) !== "function" ){
			seajs.log("Property "+path+" is not a valid function");
			return;
		}

		if( origMethod['__target__'] !== target){

			var proxy = target[methodName] = function(){
				var args = arguments;
				_each( proxy['__before__'], function(handler){
					handler.apply(this, args);
				}, this);
				var res = origMethod.apply(this, args);
				_each( proxy['__after__'], function(handler){
					handler.apply(this, args)
				});
				return res;
			}
			proxy['__target__'] = target;
		}

		_advice(proxy || origMethod, advice, handlers)
	}

	function _advice(proxy, advice, handler){

		if( handler.constructor == Array){
			_each(handler, function(h){
				_advice(proxy, advice, h);
			})
			return;
		}
		switch(advice){
			case "before" :
				var before = proxy["__before__"] = proxy["__before__"] || [];
				if( before.indexOf(handler) < 0){
					before.push(handler);
				}
				break;
			case "after":
				var after = proxy["__after__"] = proxy["__after__"] || [];
				if( after.indexOf(handler) < 0){
					after.push(handler);
				}
				break;
			default:
				seajs.log("Invalid advice " + advice);
		}
	}

	// seajs.aspect = function(module, path, advice, handler, fuzzy){
	// }
})(seajs)