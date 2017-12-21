(function(){
	var canvas = document.getElementById("myCanvas"); 
	var ctx = canvas.getContext("2d");
  var w = canvas.width = document.body.clientWidth;
  var h = canvas.height = document.body.clientHeight; 
  var fontSize = 18;
  var cols = Math.floor(w / fontSize);
  var columns = Array(cols);
	var katakana = 'アイウエオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモヤユヨラリルレロワヰヱヲンヴ00000111111';
	//一个字符
	class Code {
		constructor(y){
			this.y = y;
			this.text = katakana[Math.floor(Math.random() * katakana.length)];
			this.timestamp = Date.now();
			this.diff = Math.random() * 200 + 500;
		}
		get content(){	
			//如果过了1秒以上，就换个字符
			var now = Date.now();
			var diff = now - this.timestamp;
			if(diff > this.diff) {
				this.timestamp = now - (diff - this.diff);
				return this.text = katakana[Math.floor(Math.random() * katakana.length)];
			}
			return this.text;
		}
	}
	//class Col
	class Column {
		constructor(x, codeNum, codeColor, width, speed){
			//当前列的x坐标
			this.x = x;
			//当前列的字符数量
			this.codeNum = codeNum;
			//当前列的字符颜色
			this.codeColor = codeColor;
			//列宽
			this.width = width;
			//每一列的速度
			this.speed = speed;
			this.codes = null;
		}
		initCodes(){ 
			this.codes = [];
			for(var len = this.codeNum, i = 0-len; i < 0; i++){
				this.codes.push(new Code(i*this.width));
			}
			return this.codes;
		}
		get getCodes(){
			return this.codes || this.initCodes();
		}
	}

	function initCanvas(fontSize){
	  ctx.font = fontSize + "px arial";
	  ctx.textAlign = 'center';
	  ctx.translate(w, 0);
		ctx.scale(-1, 1);
	}
  
 
  function initRain() {
    for (var n = 0; n < cols; n++) {
      //随机速度 3~13之间
      var speed = parseInt(Math.random()*12)+8;
      //每组的x轴位置随机产生
      var colx = n * fontSize/*parseInt(Math.random()*w)*/

      var col = new Column(colx, Math.random()*5+12, '#0F0', fontSize, speed);

      columns[n] = col;
  	}
  }
  function start(){
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(0, 0, w, h);

    for (var i = 0, len = columns.length; i < len; i++) {
  		var col = columns[i];
  		var codes = col.getCodes;
  		for(var j = 0, len2 = codes.length; j < len2; j++) {
  			var code = codes[j];
        code.y += col.speed;
        if(j === 0 && code.y > h) {
        	col.codeNum = Math.random()*5+12;
        	col.speed = Math.floor(Math.random()*12)+8;
        	col.codes = null;
        	break;
        }
      	ctx.fillStyle = col.codeColor;
      	ctx.fillText(code.content, col.x, code.y);

  		}

    }
  }
  initCanvas(18);
  initRain();
  setInterval(start, 30);
}());
