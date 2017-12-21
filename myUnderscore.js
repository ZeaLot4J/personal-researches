(function() {
	//root是window
	var root = this;
	//_就是underscore的意思
	//如果在加载underscore之前，window中就有_这个属性，先保存起来，noConflict要用
	//然后用underscore库的_属性将window._覆盖掉
	var previousUnderscore = root._;
	//保存Array, Object, Function的原型对象
	var ArrayProto = Array.prototype,
		ObjProto = Object.prototype,
		FuncProto = Function.prototype;
	//创建这几个方法的快速索引
	var push = ArrayProto.push,
		slice = ArrayProto.slice,
		toString = ObjProto.toString,
		hasOwnProperty = ObjProto.hasOwnProperty;
	//一些将会用到的原型方法
	var nativeIsArray = Array.isArray,
		nativeKeys = Object.keys,
		nativeBind = FuncProto.bind,
		nativeCreate = Object.create;

	//TODO
	var Ctor = function() {};

	//-即为underscore，一个构造方法，唯一暴露在外的对象，public方法都应绑定在这个对象上
	//_(obj)这种面向对象式的调用也是支持的
	var _ = function(obj) {
		//如果传入的参数是underscore产生的实例对象，则直接返回此对象
		if (obj instanceof _) return obj;
		//如果是用new调用的，则this必定为新生成的对象实例。否则this肯定不是new关键字新生成的对象
		if (!(this instanceof _)) return new _(obj);

		this._wrapped = obj;
	};
	//外部作用域引用闭包中的对象，这样一来，闭包的作用域就不会释放
	//同时也将_对象暴露在外面提供调用
	root._ = _; //underscore库的_属性把window._覆盖了
	_.VERSION = '1.8.3';

	//将一个函数包装，按要求变成一个更强大的函数
	var optimizeCb = function(func, context, argCount) {
		if (context === void 0) return func; //如果context为undefined
		switch (argCount == null ? 3 : argCount) { //如果argCount为undefined，则为3
			case 1:
				return function(value) {
					return func.call(context, value);
				};
			case 2:
				return function(value, other) {
					return func.call(context, value, other);
				};
			case 3:
				return function(value, index, collection) {
					return func.call(context, value, index, collection);
				}; //accumulator(memo)为第一个参数，value为第二个参数	
			case 4:
				return function(accumulator, value, index, collection) {
					return func.call(context, accumulator, value, index, collection);
				};
		}
		return function() {
			return func.apply(context, arguments);
		}
	}


	//Object.create的polyfill
	var baseCreate = function(prototype) {
		if (!_.isObject(prototype)) return {};
		if (nativeCreate) return nativeCreate(prototype);
		//这里可以学习，Ctor这个构造函数可以重复利用	
		Ctor.prototype = prototype;
		var result = new Ctor();
		Ctor.prototype = null;
		return result
	};

	//根据方法名返回一个方法（函数）
	//可以认为是属性访问器
	var property = function(key) {
		return function(obj) {
			return obj == null ? void 0 : obj[key];
		};
	}

	_.property = property;

	var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
	var getLength = property('length');

	//有三种ArrayLike的类型，string, array, arguments
	var isArrayLike = function(collection) {
		var length = getLength(collection);
		return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
	};

	//这是一个功能很丰富的内部函数，专门用来生成函数
	//根据value的类型，返回对应的迭代函数
	//如果没有传入value，则返回一个函数，此函数接受一个值，返回相同的值
	//如果value是函数类型，则将其包装一下返回
	//如果value是非函数的Object，则返回一个对象属性匹配器
	//如果以上都不是，则认为value是一个属性名，由此返回一个属性访问器
	var cb = function(value, context, argCount) {
		if (value == null) return _.identity;
		if (_.isFunction(value)) return optimizeCb(value, context, argCount);
		if (_.isObject(value)) return _.matcher(value);
		return _.property(value);
	};

	//返回一个迭代函数
	_.iteratee = function(value, context) {
		return cb(value, context, Infinity);
	};

	_.each = _.forEach = function(obj, iteratee, context) {
		iteratee = optimizeCb(iteratee, context);
		var i, length;
		if (isArrayLike(obj)) {
			for (i = 0, length = obj.length; i < length; i++) {
				iteratee(obj[i], i, obj);
			}
		} else {
			var keys = _.keys(obj);
			for (i = 0, length = keys.length; i < length; i++) {
				iteratee(obj[keys[i]], keys[i], obj);
			}
		}
		return obj;
	};
	//这个iteratee函数必须要有返回值，不然结果全是undefined
	_.map = _.collect = function(obj, iteratee, context) {
		iteratee = cb(iteratee, context);
		//如果obj是数组，那么keys为false，是对象则keys为属性数组
		var keys = !isArrayLike(obj) && _.keys(obj),
			length = (keys || obj).length, //这里写法非常精妙，如果keys为false，则obj肯定是数组
			results = new Array(length); //如果keys存在，则obj肯定是对象，keys为数组
		for (var index = 0; index < length; index++) {
			var currentKey = keys ? keys[index] : index;
			results[index] = iteratee(obj[currentKey], currentKey, obj);
		}
		return results;
	};

	//产生一个reduce函数，dir为1表示foldl，-1表示foldr
	function createReduce(dir) {
		//此函数的内部小迭代函数，调用后产生折叠的最终结果
		//memo是每一步折叠结果，keys是属性数组，index是起始折叠下标，
		//length是数组长度或者对象属性个数
		function iterator(obj, iteratee, memo, keys, index, length) {
			for (; index >= 0 && index < length; index += dir) {
				//要区分一下数组和对象
				var currentKey = keys ? keys[index] : index;
				//memo为第一个参数，obj[currentKey]为第二个参数
				memo = iteratee(memo, obj[currentKey], currentKey, obj);
			}
			return memo;
		}
		return function(obj, iteratee, memo, context) {
			//包装成一个有accumulator的迭代函数
			iteratee = optimizeCb(iteratee, context, 4);
			var keys = !isArrayLike(obj) && _.keys(obj),
				length = (keys || obj).length,
				index = dir > 0 ? 0 : length - 1;
			//如果没有memo，则memo为第一个值
			if (arguments.length < 3) {
				memo = obj[keys ? keys[index] : index];
				index += dir;
			}
			return iterator(obj, iteratee, memo, keys, index, length);
		};
	}

	_.reduce = _.foldl = _.inject = createReduce(1);

	_.reduceRight = _.foldr = createReduce(-1);

	//predicate为一个true test函数
	//此函数查找满足条件的第一个元素
	_.find = _.detect = function(obj, predicate, context) {
		var key;
		if (isArrayLike(obj)) {
			key = _.findIndex(obj, predicate, context);
		} else {
			key = _.findKey(obj, predicate, context);
		}
		if (key !== void 0 && key !== -1) return obj[key];
	};

	//obj是数组，下标没找到返回-1
	_.findIndex = createPredicateIndexFinder(1);
	_.findLastIndex = createPredicateIndexFinder(-1);

	//obj是对象，属性没找到返回undefined
	_.findKey = function(obj, predicate, context) {
		predicate = cb(predicate, context);
		var keys = _.keys(obj),
			key;
		for (var i = 0, length = keys.length; i < length; i++) {
			key = keys[i];
			if (predicate(obj[key], key, obj)) return key;
		}
		//没找到就返回undefined
	};

	//保留满足条件的元素
	_.filter = _.select = function(obj, predicate, context) {
		var results = [];
		predicate = cb(predicate, context);
		_.each(obj, (value, index, list) => {
			if (predicate(value, index, list))
				results.push(value);
		});
		return results;
	};

	//对一个predicate取反面
	_.negate = function(predicate) {
			return function() {
				return !predicate.apply(this, arguments);
			};
		}
		//去除满足条件的元素
	_.reject = function(obj, predicate, context) {
		return _.filter(obj, _.negate(predicate), context);
	};

	//判断所有的元素是否都满足条件
	_.every = _.all = function(obj, predicate, context) {
		predicate = cb(predicate);
		var keys = !isArrayLike(obj) && _.keys(obj),
			length = (keys || obj).length;
		for (var index = 0; index < length; index++) {
			var currentKey = keys ? keys[index] : index;
			if (!predicate(obj[currentKey], currentKey, obj))
				return false;
		}
		return true;
	};

	//判断至少有一个元素是否满足条件
	_.some = _.any = function(obj, predicate, context) {
		predicate = cb(predicate);
		var keys = !isArrayLike(obj) && _.keys(obj),
			length = (keys || obj).length;
		for (var index = 0; index < length; index++) {
			var currentKey = keys ? keys[index] : index;
			if (predicate(obj[currentKey], currentKey, obj))
				return true;
		}
		return false;
	};

	//判断item是否在obj中，使用===
	_.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
		if (!isArrayLike(obj)) obj = _.values(obj);
		if (typeof fromIndex != 'number' || guard) fromIndex = 0;
		return _.indexOf(obj, item, fromIndex) >= 0;
	};

	//method确切地说应该是methodName或func
	//后面还可以写上method的参数 (obj, method, arg0, arg1...)
	//当想调用方法作用于一个集合上的每一个元素上时，可以使用此函数，而map只能使用函数
	_.invoke = function(obj, method) {
		//取obj和method之后的参数
		var args = slice.call(arguments, 2);
		var isFunc = _.isFunction(method);
		return _.map(obj, function(value) {
			//method有可能只是个名字不是func，这个名字可能还不存在
			var func = isFunc ? method : value[method];
			return func == null ? func : func.apply(value, args);
		});
	};

	//map的应用，obj必须是个数组，取数组中每个元素的key属性值
	_.pluck = function(obj, key) {
		return _.map(obj, _.property(key));
	};

	//filter的应用 select * from where key1 = value1 and key2 = value2 and ...
	_.where = function(obj, attrs) {
		return _.filter(obj, _.matcher(attrs));
	};

	//find的应用
	_.findWhere = function(obj, attrs) {
		return _.find(obj, _.matcher(attrs));
	};

	_.max = function(obj, iteratee, context) {
		var result = -Infinity,
			lastComputed = -Infinity,
			value, computed;
		//如果没有iteratee
		if (iteratee == null && obj != null) {
			obj = isArrayLike(obj) ? obj : _.values(obj);
			//循环找最大值
			for (var i = 0, length = obj.length; i < length; i++) {
				value = obj[i];
				if (value > result) result = value;
			}
		} else {
			iteratee = cb(iteratee, context);
			_.each(obj, function(value, index, list) {
				computed = iteratee(value, index, list);
				//TODO 后面这里什么情况下会出现computed === -Infinity
				if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
					result = value;
					lastComputed = computed;
				}
			});
		}
		return result;
	};

	_.min = function(obj, iteratee, context) {
		var result = Infinity,
			lastComputed = Infinity,
			value, computed;
		//如果没有iteratee
		if (iteratee == null && obj != null) {
			obj = isArrayLike(obj) ? obj : _.values(obj);
			//循环找最大值
			for (var i = 0, length = obj.length; i < length; i++) {
				value = obj[i];
				if (value < result) result = value;
			}
		} else {
			iteratee = cb(iteratee, context);
			_.each(obj, function(value, index, list) {
				computed = iteratee(value, index, list);
				//TODO 后面这里什么情况下会出现computed === Infinity
				if (computed < lastComputed || computed === Infinity && result === Infinity) {
					result = value;
					lastComputed = computed;
				}
			});
		}
		return result;
	};

	//现代Fisher-Yates乱序法inside-out：每次取一个随机数0 <= rand < length之间，将第rand和最后下标交换，最后下标前移
	_.shuffle = function(obj) {
		var set = isArrayLike(obj) ? obj : _.values(obj);
		var length = set.length;
		var shuffled = Array(length);
		for (var index = 0, rand; index < length; index++) {
			rand = _.random(index); //随机数范围包括index
			if (index !== rand) shuffled[index] = shuffled[rand];
			shuffled[rand] = set[index];
		}
		return shuffled;
	};

	//取样,随机抽取obj集合中的n个元素，如果n未定义，则随机抽取一个元素
	_.sample = function(obj, n, guard) {
		if (n == null || guard) {
			if (!isArrayLike(obj)) obj = _.values(obj);
			return obj[_.random(obj.length - 1)];
		}
		return _.shuffle(obj).slice(0, Math.max(0, n)); //这种max出现不止一两次了，专门用来防止参数为负数的情况
	};

	//按照iteratee处理后的值对obj进行排序，返回一个排过序的副本，
	//iteratee也可以是属性名，即sortby propertyName
	_.sortBy = function(obj, iteratee, context) {
		//如果iteratee是函数，则返回一个迭代函数，如果是属性名，则返回属性访问器(函数)
		iteratee = cb(iteratee, context);
		//首先需要将obj映射一下，生成{value: obj, index:index, criteria: getProperty}
		//再按照criteria排序，最后把value提取出来
		return _.pluck(_.map(obj, function(value, index, list) {
			return {
				value: value,
				index: index,
				criterion: iteratee(value, index, list)
			};
		}).sort(function(left, right) {
			var a = left.criterion,
				b = right.criterion;
			if (a !== b) {
				if (a > b || a === void 0) return 1;
				if (a < b || b === void 0) return -1;
			}
			return left.index - right.index;
		}), 'value');
	};

	//behavior是一个函数，不同的behavior生成不同效果的函数
	var group = function(behavior) {
		return function(obj, iteratee, context) {
			var result = {};
			iteratee = cb(iteratee, context);
			_.each(obj, function(value, index) {
				var key = iteratee(value, index, obj); //用传入的计算函数进行计算
				behavior(result, value, key);
			});
			return result;
		};
	};

	//按传入的iteratee计算出的结果进行分组，计算出的结果作为键，键相同的都放入同一个数组
	_.groupBy = group(function(result, value, key) {
		if (_.has(result, key))
			result[key].push(value); //相同的属性，则加入到值数组中去
		else
			result[key] = [value]; //新的属性，则新加一个属性和值
	});

	//计算出的结果作为键，键不会相同，一个键一个值
	_.indexBy = group(function(result, value, key) {
		result[key] = value;
	});

	//计算出的结果作为键，值为数量
	_.countBy = group(function(result, value, key) {
		if (_.has(result, key)) {
			result[key]++;
		} else {
			result[key] = 1;
		}
	});

	_.toArray = function(obj) {
		//如果obj不存在
		if (!obj) return [];
		if (_.isArray(obj)) return slice.call(obj);
		if (isArrayLike(obj)) return _.map(obj, _.identity);
		return _.values(obj);
	}

	_.size = function(obj) {
		if (obj == null) return 0;
		return isArrayLike(obj) ? obj.length : _.keys(obj).length;
	};

	//将一个集合划分成两个数组，一个满足predicate，另一个不满足
	_.partition = function(obj, predicate, context) {
		predicate = cb(predicate);
		//如果obj是{}类型，也不用处理，each会处理
		var pass = [],
			fail = [];
		_.each(obj, function(value, key, obj) {
			//这种写法又再次出现，可以学习一下
			(predicate(value, key, obj) ? pass : fail).push(value);
		});
		return [pass, fail];
	};



	// 数组函数
	// ---------------

	//返回前n个元素
	_.first = _.head = function(array, n, guard) {
		if (array == null) return void 0;
		if (n == null || guard) return array[0];
		return _.initial(array, array.length - n);
	};

	//返回除了最后n个元素的所有元素
	_.initial = function(array, n, guard) {
		return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
	};

	//返回后n个元素
	_.last = function(array, n, guard) {
		if (array == null) return void 0;
		if (n == null || guard) return array[array.length - 1];
		return _.rest(array, Math.max(0, array.length - n));
	};

	//返回除了前n个元素之外的后面所有元素
	_.rest = _.tail = _.drop = function(array, n, guard) {
		return slice.call(array, n == null || guard ? 1 : n);
	};

	//去除数组中的falsy数据，'' undefined 0 [] NaN
	_.compact = function(array) {
		return _.filter(array, _.identity);
	};

	//展平数组的核心方法，C风格
	var flatten = function(input, shallow, strict, startIndex) {
		var output = [],
			idx = 0;
		for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
			var value = input[i];
			if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
				if (!shallow) value = flatten(value, shallow, strict);
				var j = 0,
					len = value.length;
				output.length += len;
				while (j < len) {
					output[idx++] = value[j++];
				}
			} else if (!strict) { //这个strict参数可以控制是否加入非数组元素
				output[idx++] = value;
			}
		}
		return output;
	};
	//将一个嵌套数组展平，默认会递归，shallow为true则只展平一层
	_.flatten = function(array, shallow) {
		return flatten(array, shallow, false);
	};

	//去除array中的一些元素返回
	_.without = function(array) {
		_.difference(array, slice.call(arguments, 1));
	};

	//求多个array的并集，先把参数展平一层，再去重
	_.union = function() {
		return _.uniq(flatten(arguments, true, true));
	};

	//求array与其它n个数组的交集，就是循环查找
	_.intersection = function(array) {
		var result = [];
		var argsLength = arguments.length;
		for (var i = 0, length = getLength(array); i < length; i++) {
			var item = array[i];
			if (_.contains(result, item)) continue;
			for (var j = 1; j < argsLength; j++) {
				if (!_.contains(arguments[j], item)) break;
			}
			if (j === argsLength) result.push(item);
		}
		return result;
	};

	//传入第一个数组和后面n个数组，只在第一个数组中出现的元素会保留
	_.difference = function(array) {
		var rest = flatten(arguments, true, true, 1); //从第2个开始
		//array中不在rest中出现的元素会保留下来
		return _.filter(array, function(value) {
			return !_.contains(rest, value);
		});
	};

	//传入多个数组，将其转置，成为一个二维数组
	_.zip = function() {
		return _.unzip(arguments);
	}

	//传入的参数是一个二维数组，转置仍然是一个二维数组
	_.unzip = function(array) {
		//取里面最长的那个数组的长度
		var length = array && _.max(array, getLength).length || 0;
		var result = Array(length);
		for (var index = 0; index < length; index++) {
			result[index] = _.pluck(array, index);
		}
		return result;
	};

	//传入参数可以是两个array，一个为keys，另一个为values，将组合成一个完整的{key1: value1, key2: value2, key3: value3}
	//也可以是一个二维数组[[key1, value1],[key2, value2],[key3, value3]]，同样组合成一个完整的{}
	_.object = function(list, values) {
		var result = {};
		for (var i = 0, length = getLength(list); i < length; i++) {
			if (values) {
				result[list[i]] = values[i];
			} else {
				result[list[i][0]] = list[i][1];
			}
		}
		return result;
	};

	//产生一个下标查找predicate函数，dir为1从左往右找，-1则相反
	function createPredicateIndexFinder(dir) {
		return function(array, predicate, context) {
			predicate = cb(predicate, context);
			var length = getLength(array),
				index = dir > 0 ? 0 : length - 1;
			for (; index >= 0 && index < length; index += dir) {
				if (predicate(array[index], index, array)) return index;
			}
			return -1;
		};
	}

	//二分查找，在array中查找对应值的下标，array必须是排过序的
	//iteratee就是个comparator，如果没有iteratee，则iteratee为identity，obj为value
	_.sortedIndex = function(array, obj, iteratee, context) {
		iteratee = cb(iteratee);
		var value = iteratee(obj);
		var low = 0,
			high = getLength(array);
		while (low < high) {
			var mid = Math.floor((low + high) / 2);
			if (iteratee(array[mid]) < value) low = mid + 1;
			else high = mid;
		}
		return low;
	};

	//产生一个下标查找函数，如果有sortedIndex，则会使用二分查找
	function createIndexFinder(dir, predicateFind, sortedIndex) {
		//idx可能是查找的起始位置，也可能是一个boolean值，是否已经排序
		return function(array, item, idx) {
			var i = 0,
				length = getLength(array);
			//如果idx是查找的开始位置
			if (typeof idx == 'number') {
				if (dir > 0) { //如果idx为正数，那不用多说；如果idx为负数，则取长度的补数，如果负得太多，就从0开始
					i = idx >= 0 ? idx : Math.max(idx + length, i);
				} else { //同理
					length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
				}
				//如果idx是一个boolean值，确定array已经排序 
			} else if (sortedIndex && idx && length) {
				idx = sortedIndex(array, item);
				return array[idx] === item ? idx : -1;
			}
			//如果item为NaN，可能array中有NaN这个元素
			if (item !== item) {
				idx = predicateFind(slice.call(array, i, length), _.isNaN);
				return idx >= 0 ? idx + i : -1;
			}
			//如果array没有排过序
			for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
				if (array[idx] === item) return idx;
			}
			return -1;
		};
	}
	//传入的_.findIndex只是用于查找 NaN元素
	_.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
	_.lastIndexOf = createIndexFinder(-1, _.findLastIndex, _.sortedIndex);

	_.range = function(start, stop, step) {
		//stop step可能没有
		if (stop == null) { //如果没有stop，就肯定没有step
			stop = start || 0; //stop改为start的值，start改为0
			start = 0;
		}
		//如果有stop，也可能没有step
		step = step || 1; //默认步长1

		//如果start比stop还大，这是不合法参数，返回一个空数组
		var length = Math.max(Math.ceil((stop - start) / step), 0);
		var range = Array(length);

		for (var idx = 0; idx < length; idx++, start += step) {
			range[idx] = start;
		}
		return range;
	};


	//返回去重后的数组
	_.uniq = _.unique = function(array, isSorted, iteratee, context) {
		//如果isSorted不是布尔值
		if (!_.isBoolean(isSorted)) {
			context = iteratee; //这些参数全部向前移一位
			iteratee = isSorted;
			isSorted = false;
		}
		if (iteratee != null) iteratee = cb(iteratee, context);
		var result = [];
		var seen = [];
		for (var i = 0, length = getLength(array); i < length; i++) {
			var value = array[i],
				computed = iteratee ? iteratee(value, i, array) : value;
			//如果array排过序，则只要和上一个元素比较一下是否重复
			//此时seen不是数组，只保存上一个元素用于比较
			if (isSorted) {
				if (!i || seen !== computed) result.push(value);
				seen = computed;
				//TODO 这里为何要seen?不是累赘吗？
			} else if (iteratee) {
				if (!_.contains(seen, computed)) {
					seen.push(computed);
					result.push(computed);
				}
			} else if (!_.contains(result, computed)) {
				result.push(computed);
			}
		}
		return result;
	}


	//Function有关的函数

	//sourceFunc的执行上下文为context，boundFunc的执行上下文为callingContext
	var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
		//如果boundFunc的执行上下文this不是new出来的实例，那没问题
		if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
		//一般不会出现下面这种情况，不提倡对绑定后的函数使用new，这样会凭空制造麻烦
		//如果boundFunc是构造函数，且通过new调用
		//self为继承后的实例，可以直接认为
		var self = baseCreate(sourceFunc.prototype); //只要是函数就有prototype，一般只会去使用构造函数的prototype
		//把sourceFunc绑在实例self上执行，sourceFunc是构造函数，正常情况是没有返回值的，返回undefined
		var result = sourceFunc.apply(self, args);
		//如果构造函数返回了一个非null对象，则就返回这个对象
		if (_.isObject(result)) return result;
		//如果返回的undefined,null,和非对象类型，则应该返回之前的实例
		return self;
	};


	//和原生的bind一样
	_.bind = function(func, context) {
		if (nativeBind && nativeBind === func.bind) return nativeBind.apply(func, slice.call(arguments, 1));
		if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
		var args = slice.call(arguments, 2);
		var bound = function() { //如果是new bound()这样调用，就需要小心判断了
			return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
		}; //这里明显可以直接传入args，不知道这要干嘛
		return bound;
	};

	_.partial = function(func) {
		//已占位参数
		var boundArgs = slice.call(arguments, 1);
		// console.log(this);//为_
		var bound = function() {
			// console.log(this);//为第二次调用的执行上下文
			var position = 0,
				length = boundArgs.length;
			//args为最终调用的参数
			//arguments为剩余参数
			var args = Array(length); //args先预设为占位参数的数量，后面可能还会变长
			for (var i = 0; i < length; i++) {
				//如果占位参数是占位符，则将剩余参数填上，否则就把占位参数填上
				args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
			}
			//arguments剩余参数可能还没用完，即position还有
			while (position < arguments.length) args.push(arguments[position++]);
			return executeBound(func, bound, this, this, args);
		};
		return bound;
	};

	//传入的参数为obj, methodName1, methodName2...
	//将这些方法的执行上下文绑死在obj上，以后不管将这些方法如何赋值给别的变量，
	//执行上下文永远都不会变
	_.bindAll = function(obj) {
		var i, length = arguments.length,
			key;
		//必须要有绑定方法名
		if (length < 1) throw new Error('bindAll must be passed function names');
		for (i = 1; i < length; i++) {
			key = arguments[i];
			//将obj的方法obj[key]绑定到obj上，从此obj[key]这个方法中的this固定不会变化
			obj[key] = _.bind(obj[key], obj);
		}
		return obj;
	};

	//非常厉害的函数，将普通的函数进行包装，使其可以记录每一次的计算结果
	//和generator不太一样，generator只保存上一次调用的结果，而memoize会缓存所有的结果
	//稍加改变，可以实现generator
	_.memoize = function(func, hasher) { //可以选择性的传入一个哈希算法
		//使用时实际上调用的是这个memoize，可以传入多个值
		var memoize = function(key) {
			var cache = memoize.cache; //如果没有哈希函数，则取第一值作地址
			var address = '' + (hasher ? hasher.apply(this, arguments) : key);
			//如果缓存中没有这个地址，就把计算结果加入缓存
			if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
			return cache[address];
		};
		//缓存
		memoize.cache = {};
		return memoize;
	};

	//几乎和setTimeout一模一样，但是可以有函数参数args
	_.delay = function(func, wait) {
		var args = slice.call(arguments, 2);
		return setTimeout(function() {
			return func.apply(null, args);
		}, wait);
	};

	//使用partial application推迟执行传入的_位函数，相当于setTimeout(func, 0)
	_.defer = _.partial(_.delay, _, 1);

	//比较不容易看懂，但是设计的很好，要考虑多种情况，默认第一次调用和最后一次调用都会执行func，
	//如果配置了{leading: false}则第一次调用不会执行func，
	//如果配置了{trailing: false}则最后一次调用不会执行func
	//如果配置了{leading: false, trailing: false}，综合上面两种情况 
	_.throttle = function(func, wait, options) {
		var previous = 0,
			timeout = null,
			result, context, args;
		//没有传入options的话，默认为包含leading和trailing
		if (!options) options = {};
		var later = function() {
			previous = options.leading === false ? 0 : _.now();
			timeout = null;
			result = func.apply(context, args);
			if (!timeout) context = args = null;
		};
		return function() {
			//调用的当前时间戳
			var now = _.now();
			//如果还没调用过的话，并且设置为第一次调用不触发事件
			if (!previous && options.leading === false) previous = now;
			//距离即将调用还差多少时间
			var remaining = wait - (now - previous);
			context = this; //赋值给闭包用
			args = arguments;
			//如果到了调用的时刻或者已经过了调用的时刻
			//后面这个判断是防止客户端修改了系统时间
			if (remaining <= 0 || remaining > wait) { //这里会处理leading === false的情况
				if (timeout) { //如果有定时器，则清除
					clearTimeout(timeout);
					timeout = null;
				}
				previous = now;
				//马上调用
				result = func.apply(context, args);
				if (!timeout) context = args = null;
				//如果还不到立刻执行的时间，启动一个定时器
			} else if (!timeout && options.trailing !== false) { //当trailing===false里，这里会跳过
				timeout = setTimeout(later, remaining);
			}
			return result;
		};
	};

	//immediate为true的话，只在最开始调用一次
	_.debounce = function(func, wait, immediate) {
		var timeout, args, context, timestamp, result;

		var later = function() {
			//这里肯定是个正数，如果距离上一次调用很久，则会很大，大于wait
			var last = _.now() - timestamp;
			if (last < wait && last >= 0) {
				timeout = setTimeout(later, wait - last);
			} else { //大于wait，接下来判断要不要立刻执行
				timeout = null;
				if (!immediate) { //immediate为true，说明最开始就执行过了，这里就不执行了
					result = func.apply(context, args);
					if (!timeout) context = args = null;
				}
			}
		};
		return function() {
			context = this;
			args = arguments;
			timestamp = _.now();
			//如果immediate为true，且第一次调用，则一开始就会执行func
			var calNow = immediate && !timeout;
			//不管怎样，第一次都会设置一个定时器
			if (!timeout) timeout = setTime(later, wait);
			if (callNow) {
				result = func.apply(context, args);
				context = args = null;
			}
		};
	};

	//将func包在wrapper中，实现装饰器，func必须是wrapper的第一个参数
	_.wrap = function(func, wrapper) {
		//就是将wrapper函数的第一个参数用func提前占位
		return _.partial(wrapper, func);
	};

	//调用第n次开始触发func函数
	_.after = function(times, func) {
		return function() {
			if (--times < 1) {
				return func.apply(this, arguments);
			}
		};
	};

	//调用n次之后，func不会再执行，结果返回最后一次的值
	_.before = function(times, func) {
		var memo;
		return function() {
			if (--times > 0) {
				memo = func.apply(this, arguments);
			}
			if (times <= 1) func = null;
			return memo;
		};
	};

	//只执行一次，后面再次调用也只会返回最开始的值
	_.once = _.partial(_.before, 2);

	//函数组合，从最后一个函数开始
	_.compose = function() {
		var funcs = arguments;
		var start = funcs.length - 1;
		return function() {
			var i = start;
			var result = funcs[start].apply(this, arguments);
			while (i--) result = funcs[i].call(this, result);
			return result;
		};
	};

	//兼容IE毒瘤
	var hasEnumBug = !{
		toString: null
	}.propertyIsEnumerable('toString');
	var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
		'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'
	];

	function collectNonEnumProps(obj, keys) {
		var nonEnumIdx = nonEnumerableProps.length;
		var constructor = obj.constructor;
		var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

		// Constructor is a special case.
		var prop = 'constructor';
		if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

		while (nonEnumIdx--) {
			prop = nonEnumerableProps[nonEnumIdx];
			if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
				keys.push(prop);
			}
		}
	};

	//常量产生器
	_.constant = function(value) {
		return function() {
			return value;
		}
	};

	//不管传入什么参数都返回undefined，和void 0差不多
	_.noop = function() {};

	//产生取得一个object的所有属性的函数，如果object未定义或为null等，那个函数返回undefined
	//propertyOf和property几乎一模一样，就是再次调用参数的顺序相反，先对象还是先属性名
	_.propertyOf = function(obj) {
		return obj == null ? function() {} : function(key) {
			return obj[key];
		};
	};

	//如果在加载underscore之前，window中就有_属性，则可以使用这个函数解决命名冲突
	_.noConflict = function() {
		//将之前保存的window._还原
		root._ = previousUnderscore;
		return this; //把underscore库的_属性返回作为对外唯一暴露接口
	};

	//传入一个值，返回一个相同的值
	_.identity = function(value) {
		return value;
	};

	_.isArray = nativeIsArray || function(obj) {
		return toString.call(obj) === '[object Array]';
	};

	//判断一个对象是否为Object类型，包括function, object(包括array), 排除null, undefined, NaN
	_.isObject = function(obj) {
		var type = typeof obj;
		return type === 'function' || type === 'object' && !!obj;
	};

	//这几个类型判断函数都一样
	//isArguments isFunction isString isNumber isDate isRegExp isError
	_.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
		_['is' + name] = function(obj) {
			return toString.call(obj) === '[object ' + name + ']';
		};
	});

	_.isBoolean = function(obj) {
		return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
	};

	//判断obj是不是NaN这个特殊对象
	//NaN是个Number类型，和并且和自身比较不等
	_.isNaN = function(obj) {
		return _.isNumber(obj) && obj !== +obj;
	};

	//判断是否严格为null
	_.isNull = function(obj) {
		return obj === null;
	}

	_.isUndefined = function(obj) {
		return obj === void 0;
	}

	//判断一个对象是否有指定的属性
	_.has = function(obj, key) {
		return obj != null && hasOwnProperty.call(obj, key);
	};
	//返回一个对象的本身属性的数组
	_.keys = function(obj) {
		//如果不是对象类型，是原始类型，则返回空数组，没有属性
		if (!_.isObject(obj)) return [];
		//调用函数之前都要判断这个函数有没有定义，这是动态语言
		if (nativeKeys) return nativeKeys(obj);
		//如果没有定义这个函数
		var keys = [];
		//in操作符是迭代obj本身的属性，再迭代原型的属性，这里只要本身的属性
		for (var key in obj)
			if (_.has(obj, key)) keys.push(key);

			//IE毒瘤
		if (hasEnumBug) collectNonEnumProps(obj, keys);
		return keys;
	};
	//和_.keys差不多，此函数返回对象的所有属性的数组，包括原型链上的
	_.allKeys = function(obj) {
		if (!_.isObject(obj)) return [];
		var keys = [];
		for (var key in obj) keys.push(key);

		//IE毒瘤
		if (hasEnumBug) collectNonEnumProps(obj, keys);
		return keys;
	};
	//返回对象所有的值，和_.keys对应
	_.values = function(obj) {
		var keys = _.keys(obj),
			length = keys.length,
			values = new Array(length);
		for (var i = 0; i < length; i++) {
			values[i] = obj[keys[i]];
		}
		return values;
	};

	//此函数用于判断object和attrs对象中的属性和值一致
	_.isMatch = function(object, attrs) {
		var keys = _.keys(attrs),
			length = keys.length;
		//如果object为null或者没有定义，则只有当attrs也为null或没有定义时，属性一致
		if (object == null) return !length;
		var obj = Object(object);
		for (var i = 0; i < length; i++) {
			var key = keys[i];
			if (!(key in obj) || obj[key] !== attrs[key]) return false;
		}
		return true;
	};

	var eq = function(a, b, aStack, bStack) {
		//=== 会判定 -0 === 0，但是我们认为这不应该相等，于是利用=== 比较-Infinity 和Infinity不会相等的特性
		if (a === b) return a !== 0 || 1 / a === 1 / b;
		//a 和 b要么都为null，要么都为undefined，这样才相等
		if (a == null || b == null) return a === b;

		//_包裹的实例也要比较
		if (a instanceof _) a = a._wrapped;
		if (b instanceof _) b = b._wrapped;

		//接下来比较确切类型
		var className = toString.call(a);
		if (className !== toString.call(b)) return false;
		switch (className) {
			//正则和字符串一起处理
			case '[object RegExp]':
			case '[object String]':
				return '' + a === '' + b;
				//数字要小心NaN，NaN应当相等 -0和0应该不相等
			case '[object Number]':
				if (+a !== +a) return +b !== +b; //如果是NaN
				return +a === 0 ? 1 / +a === 1 / b : +a === +b; //0 和 -0不应该相等
				//日期和布尔转化成数字
			case '[object Date]':
			case '[object Boolean]':
				return +a === +b;
		}
		//对于数组类型要递归
		//后面非常繁琐难懂，此函数就到这 END
		var areArrays = className === '[object Array]';
		if (!areArrays) {
			if (typeof a != 'object' || typeof b != 'object') return false;

			// Objects with different constructors are not equivalent, but `Object`s or `Array`s
			// from different frames are.
			var aCtor = a.constructor,
				bCtor = b.constructor;
			if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
					_.isFunction(bCtor) && bCtor instanceof bCtor) && ('constructor' in a && 'constructor' in b)) {
				return false;
			}
		}
		// Assume equality for cyclic structures. The algorithm for detecting cyclic
		// structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

		// Initializing stack of traversed objects.
		// It's done here since we only need them for objects and arrays comparison.
		aStack = aStack || [];
		bStack = bStack || [];
		var length = aStack.length;
		while (length--) {
			// Linear search. Performance is inversely proportional to the number of
			// unique nested structures.
			if (aStack[length] === a) return bStack[length] === b;
		}

		// Add the first object to the stack of traversed objects.
		aStack.push(a);
		bStack.push(b);

		// Recursively compare objects and arrays.
		if (areArrays) {
			// Compare array lengths to determine if a deep comparison is necessary.
			length = a.length;
			if (length !== b.length) return false;
			// Deep compare the contents, ignoring non-numeric properties.
			while (length--) {
				if (!eq(a[length], b[length], aStack, bStack)) return false;
			}
		} else {
			// Deep compare objects.
			var keys = _.keys(a),
				key;
			length = keys.length;
			// Ensure that both objects contain the same number of properties before comparing deep equality.
			if (_.keys(b).length !== length) return false;
			while (length--) {
				// Deep compare each member
				key = keys[length];
				if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
			}
		}
		// Remove the first object from the stack of traversed objects.
		aStack.pop();
		bStack.pop();
		return true;
	};

	//深度比较相等这个自己定义的，只能用于原始类型和{} []类型的深度比较
	_.isEqual = function(obj, other) {
		//首先确切类型要相同
		if (toString.call(obj) === toString.call(other)) {
			//如果是{}和[]类型，
			if (_.isObject(obj) && typeof obj !== 'function') {
				for (var key in obj) {
					if (!arguments.callee(obj[key], other[key])) return false;
				}
				//如果是原始类型和函数
			} else if (obj !== other) {
				return false;
				0
			}
			return true;
		}
		return false;
	};

	//返回一个匹配器，匹配器用于判断两个对象属性是否一致
	_.matcher = _.matches = function(attrs) {
		attrs = _.extendOwn({}, attrs);
		return function(obj) {
			return _.isMatch(obj, attrs);
		};
	};

	_.isEqual = function(a, b) {
		return eq(a, b);
	}

	//判断[] {} ''类型是否为空，其中{}为空是指没有自身属性
	_.isEmpty = function(obj) {
		if (obj == null) return true;
		if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length == 0;
		return _.keys(obj).length == 0;
	};

	//判断是否是元素结点
	_.isElement = function(obj) {
		return !!(obj && obj.nodeType === 1);
	};

	//判断是否有限数，借助原生的isFinite
	_.isFinite = function(obj) {
		return isFinite(obj) && !_.isNaN(parseFloat(obj));
	};

	//执行n次迭代函数，iteratee每次接收一个参数，这个参数从0递增到n-1，返回一个结果数组
	_.times = function(n, iteratee, context) {
		//要防止n的不合法
		var accum = Array(Math.max(0, n));
		iteratee = optimizeCb(iteratee, context, 1);
		for (var i = 0; i < n; i++) accum[i] = iteratee(i);
		return accum;
	};

	//随机整数生成器，生成的随机数 在min 和max之间，包括max
	_.random = function(min, max) {
		//如果max没有写，则第一个参数值为max，min为0
		if (max == null) {
			max = min;
			min = 0;
		}
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};

	_.now = Date.now || function() {
		return new Date().getTime();
	};

	var idCounter = 0;
	_.uniqueId = function(prefix) {
		var id = ++idCounter + '';
		return prefix ? prefix + id : id;
	};

	//对一个{}的每个属性值进行处理，返回一个新的{}
	_.mapObject = function(obj, iteratee, context) {
		iteratee = cb(iteratee, context);
		var keys = _.keys(obj),
			length = keys.length,
			results = {},
			currentKey;
		for (var index = 0; index < length; index++) {
			currentKey = keys[index];
			results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
		}
		return results;
	};

	//将{}转换成[key: value]的形式
	_.pairs = function(obj) {
		if (obj == null) return [];
		var keys = _.keys(obj),
			length = keys.length,
			pairs = Array(length);
		for (var i = 0; i < length; i++) {
			pairs[i] = [keys[i], obj[keys[i]]];
		}
		return pairs;
	};

	//将{}的键值互换，前提是值必须唯一，并且可以字符串化
	_.invert = function(obj) {
		var result = {};
		var keys = _.keys(obj);
		for (var i = 0, length = keys.length; i < length; i++) {
			result[obj[keys[i]]] = keys[i];
		}
		return result;
	};

	//将{}中的白名单属性和值留下，参数可以是一个predicate函数也可以是多个属性名
	_.pick = function(object, oiteratee, context) {
		var result = {},
			obj = object,
			iteratee, keys;
		if (obj == null) return result;
		if (_.isFunction(oiteratee)) {
			keys = _.allKeys(obj);
			iteratee = optimizeCb(oiteratee, context);
		} else {
			//除了第一个参数，其它全部展平作为属性
			keys = flatten(arguments, false, false, 1);
			iteratee = function(value, key, obj) {
				return key in obj;
			};
			obj = Object(obj);
		}
		for (var i = 0, length = keys.length; i < length; i++) {
			var key = keys[i];
			var value = obj[key]; //如果obj中没有key，则为undefined
			if (iteratee(value, key, obj)) result[key] = value;
		}
		return result;
	};

	//将{}中的黑名单属性和值留下，参数可以是一个predicate函数也可以是多个属性名
	_.omit = function(obj, iteratee, context) {
		if (_.isFunction(iteratee)) {
			//取函数的反
			iteratee = _.negate(iteratee);
		} else {
			var keys = _.map(flatten(arguments, false, false, 1), String);
			iteratee = function(value, key) {
				return !_.contains(keys, key);
			};
		}
		return _.pick(obj, iteratee, context);
	};

	//将obj的方法按名字排序，返回一个方法名字的数组
	_.functions = _.methods = function(obj) {
		var names = [];
		for (var key in obj) {
			if (_.isFunction(obj[key])) names.push(key);
		}
		return names.sort();
	};

	//用于转义HTML
	var escapeMap = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#x27;',
		'`': '&#x60;'
	};
	//用于反转义成HTML
	var unescapeMap = _.invert(escapeMap);

	//根据转义mapper生成转义器
	var createEscaper = function(map) {
		var escaper = function(match) {
			return map[match];
		};
		//      (?:&|<|>|"|'|`)
		var source = '(?:' + _.keys(map).join('|') + ')';
		var testRegexp = RegExp(source);
		var replaceRegexp = RegExp(source, 'g');
		return function(string) {
			string = string == null ? '' : '' + string;
			//replace可以传入一个函数来处理要替换的匹配项
			return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
		};
	};

	_.escape = createEscaper(escapeMap);
	_.unescape = createEscaper(unescapeMap);

	//三种模板分隔符
	_.templateSettings = {
		//这里要用非贪婪最小匹配?，不然下面这个字符串会全部匹配到
		// <% abc ab a%> abcd <%abcde ace %>
		evaluate: /<%([\s\S]+?)%>/g,
		interpolate: /<%=([\s\S]+?)%>/g,
		escape: /<%-([\s\S]+?)%>/g
	};
	var noMatch = /(.)^/;

	//这些特殊字符需要转义成可以在字符串中显示的字符
	var escapes = {
		"'": "'",
		'\\': '\\',
		'\r': 'r',
		'\n': 'n',
		'\u2028': 'u2028', //行分隔符
		'\u2029': 'u2029' //段分隔符
	};

	//这些字符一旦出现需要去掉
	var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

	//转义一个字符
	var escapeChar = function(match) {
		return '\\' + escapes[match];
	};

	_.template = function(text, settings, oldSettings) {
		if (!settings && oldSettings) settings = oldSettings;
		//将settings和templateSettings中的属性全部复制到settings中
		settings = _.defaults({}, settings, _.templateSettings);
		//<%([\s\S]+?)%>|<%([\s\S]+?)%>|<%([\s\S]+?)%>|$
		var matcher = RegExp([
			(settings.escape || noMatch).source,
			(settings.interpolate || noMatch).source,
			(settings.evaluate || noMatch).source
		].join('|') + '|$', 'g');
		var index = 0;
		var source = "__p+='";
		//如果对replace使用函数处理待替换字符串，则func的参数如下
		//func(匹配到的字符串，匹配组1，匹配组2，匹配组3...，第一次匹配到的位置，原整个字符串)
		//中间的匹配组由()的数量决定
		//这里有三个组
		text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
			//在每两个模板字符串之前的字符串全部要转义
			source += text.slice(index, offset).replace(escaper, escapeChar);
			//index更新为当前模板字符串的尾部
			index = offset + match.length;
			//如果匹配到了一个escape类型的模板<%-%>
			if (escape) {
				source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
			} else if (interpolate) {
				source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
			} else if (evaluate) {
				source += "';\n" + evaluate + "\n__p+='";
			}
			return match;
		});
		source += "';\n";

		if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

		source = "var __t,__p='',__j=Array.prototype.join," +
			"print=function(){__p+=__j.call(arguments,'');};\n" +
			source + 'return __p;\n';

		try { //Function('函数参数1'，'函数参数2'...，'函数体')
			var render = new Function(settings.variable || 'obj', '_', source);
		} catch (e) {
			e.source = source;
			throw e;
		}

		var template = function(data) {
			return render.call(this, data, _);
		};

		var argument = settings.variable || 'obj';
		template.source = 'function(' + argument + '){\n' + source + '}';
		return template;
	};

	//keysFunc就是类似_.keys这种函数
	//undefinedOnly为true，则表示是只给未定义的属性进行赋值的函数
	//为false，则不管属性有没有定义，都赋值，产生这么个函数
	var createAssigner = function(keysFunc, undefinedOnly) {
		//这是个赋值函数，参数不定，obj为第一个参数，是被赋值的对象
		return function(obj) {
			var length = arguments.length;
			//1个参数或者没有(undefined == null)， 1个参数的话没法赋值，返回，没有参数也返回
			if (length < 2 || obj == null) return obj;
			for (var index = 1; index < length; index++) {
				var source = arguments[index], //第2个参数开始
					keys = keysFunc(source), //取得所有的属性名
					l = keys.length;
				for (var i = 0; i < l; i++) {
					var key = keys[i]; //第1个属性
					//如果只给未定义的属性赋值，那么要保证obj[key]是undefined
					if (!undefinedOnly || obj[key] === void 0)
						obj[key] = source[key];
				}
			}
			return obj;
		};
	};
	//************* 此为underscore的继承*************
	//可以看到，underscore的继承使用的是浅拷贝继承的方式，而且可以多重继承
	_.extend = createAssigner(_.allKeys);

	//一个赋值器，赋值任何属性，不管有没有定义这个属性
	_.extendOwn = _.assign = createAssigner(_.keys);

	//给一个对象赋予未定义的属性值，定义过的属性会跳过
	_.defaults = createAssigner(_.allKeys, true);

	//带Props的Object.create()
	_.create = function(prototype, props) {
		var result = baseCreate(prototype);
		if (props) _.extendOwn(result, props);
		return result;
	};

	//浅拷贝
	_.clone = function(obj) {
		//如果obj是原始类型，则复制一份返回
		if (!_.isObject(obj)) return obj;
		//如果是数组则浅拷贝一份，
		return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
	};

	//这个函数主要是用于在链式调用中插入一个拦截函数
	//_.chain([1,2,3]).map(n => n*n).tap(alert).value();
	_.tap = function(obj, interceptor) {
		interceptor(obj);
		return obj;
	};
	//返回一个underscore实例对象，链标明为true
	_.chain = function(obj) {
		var instance = _(obj);
		instance._chain = true;
		return instance;
	};

	var result = function(instance, obj) {
		return instance._chain ? _(obj).chain() : obj;
	};

	//增加自定义的函数到underscore构造函数和原型上
	_.mixin = function(obj) {
		//对于obj的每个方法
		_.each(_.functions(obj), function(name) {
			//全部加到_构造函数上
			var func = _[name] = obj[name];
			//再全部在_构造函数的原型上包装成链式结果的方法
			_.prototype[name] = function() {
				//原型方法的调用者是_的实例
				var args = [this._wrapped];
				//把func的调用者和参数全部存在一个数组中，供后面apply
				push.apply(args, arguments); //比如_.map(this._wrapped, func)
				//第一个参数是func的调用者，第二个参数是func的返回结果
				//如果调用者是链式的，则返回结果也应该是链式的
				//如果调用者不是链式的，则返回结果保持原样
				return result(this, func.apply(_, args));
			};
		});
	};

	//把_构造函数上的所有方法都添加到_的原型上，以便实例可以调用，实现链式
	_.mixin(_);

	//把数组原型上的实用方法全部添加到_的原型上，以实现链式
	//这些方法都会修改数组，返不返回值不重要
	_.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
		var method = ArrayProto[name];
		_.prototype[name] = function() {
			var obj = this._wrapped;
			//wrapped必须是个数组
			method.apply(obj, arguments);
			//IE毒瘤的bug，shift和splice可能会没用
			if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
			return result(this, obj); //链式or not
		};
	});
	//这些方法不会修改数组，而返回一个新数组
	_.each(['concat', 'join', 'slice'], function(name) {
		var method = ArrayProto[name];
		_.prototype[name] = function() {
			return result(this, method.apply(this._wrapped, arguments));
		};
	});

	_.prototype.value = function() {
		return this._wrapped;
	};

	_.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

	_.prototype.toString = function() {
		return '' + this._wrapped;
	};

}.call(this)); //this是window
