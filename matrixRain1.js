(function(){
	var canvas = document.getElementById("myCanvas");
	var ctx = canvas.getContext("2d");

	canvas.height = window.innerHeight;
	canvas.width = window.innerWidth;
	var code = 'アイウエオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモヤユヨラリルレロワヰヱヲンヴ01'.split('');

	var font_size = 15;
	var columns = canvas.width / font_size;
	//an array of drops - one per column
	//drops的下标表示列号，内容表示行号
	var drops = [];
	for (var x = 0; x < columns; x++) {
	    drops[x] = 1;
	}

	//翻转画布，让字符镜像
	ctx.translate(canvas.width, 0);
	ctx.scale(-1, 1);
	//drawing the characters
	function draw() {
	    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
	    //这里会覆盖一层画布，但是上一次的阴影还会保留
	    ctx.fillRect(0, 0, canvas.width, canvas.height);
	    //不要使用下面这种清除，会把之前的字符清除的连影子都没有
	    // ctx.clearRect(0, 0, c.width, c.height);
	    ctx.fillStyle = "#0F0"; //green text
	    ctx.font = font_size + "px arial";
        ctx.textAlign = 'center';
	    //i代表列号，循环完成之后，画完一行字符
	    for (var i = 0; i < drops.length; i++) {
	        var text = code[Math.floor(Math.random() * code.length)];
	        
	        ctx.fillText(text, i * font_size, drops[i] * font_size);

	        //这里可以造成字符雨的不同步
	        if (drops[i] * font_size > canvas.height && Math.random() > 0.975) {
	            drops[i] = 0;
	        }

	        drops[i]++;
	    }
	}
	setInterval(draw, 40);
}());
