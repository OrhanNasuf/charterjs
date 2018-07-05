class Charter {

	constructor(p_canvasId, p_data, p_colorScheme = null, p_sort = "NONE") {

		// Define constants
		this.CANVAS = document.getElementById(p_canvasId);
		this.CONTEXT = this.CANVAS.getContext("2d");
		this.BUFFER_PADDING = 4;
		this.DEFAULT_COLOR_SCHEME = [
			"#101846",
			"#142262",
			"#1C2B80",
			"#21468D",
			"#305E9B",
			"#3877AD",
			"#3E90C0",
			"#46AACE",
			"#65BADF",
			"#89CDD0",
			"#B1DECD",
			"#DCEBCB"
		];
		
		// Define private variables
		this._dataSet = null;
		this._cachedInfo = {};
		this._buffer = {};
		this._mouseTargets = [];
		this._colorArray = [];

		this._totalVotes = 0;
		this._lastTimePassed = 0;
		this._timeDelta = 0;
		this._animIsAsleep = false;
		this._selectedIndex = NaN;

		this._width = this.CANVAS.width;
		this._height = this.CANVAS.height;

		this._mouseX = 0;
		this._mouseY = 0;

		// Public settings
		this.langString_votes = "Röster";

		this._parseData(p_data, p_sort);

		if (p_colorScheme == null) {
			this._parseColorScheme(this.DEFAULT_COLOR_SCHEME);

		} else {
			this._parseColorScheme(p_colorScheme);
		}
	}

	// Public function for wrapping text to be used in a canvas element, outputs array where each index is a new line of string.
	wrapCanvasText(p_canvasContext, p_string, p_maxWidth, p_maxRows = NaN) {
		
		if (typeof p_string != 'string') {
	
			console.log(`ERROR: Cannot wrap text! Was expecting a string but received ${typeof p_string}.`);
			return [];
		}
	
		let inputArray = p_string.split(" ");
		let outputArray = [];
		let currentLine = "";
		let i;
	
		for (i = 0; i < inputArray.length; i++) {

			if (p_canvasContext.measureText(currentLine + inputArray[i]).width > p_maxWidth && currentLine != "") {

				if (!isNaN(p_maxRows) && outputArray.length == p_maxRows - 1) {

					outputArray.push(currentLine);
					currentLine = null;
					break;

				} else {

					outputArray.push(currentLine);
					currentLine = inputArray[i] + " ";
				}

			} else {
	
				currentLine += inputArray[i] + " ";
			}
		}
	
		if (currentLine !== null) {

			outputArray.push(currentLine);
		}

		return outputArray;
	}
	
	// Public function for cutting off a line of text, outputs a short string followed by ellipses where text is omitted. 
	contractCanvasText(p_canvasContext, p_string, p_maxWidth) {

		if (typeof p_string != 'string') {
	
			console.log(`ERROR: Cannot contract text! Was expecting a string but received ${typeof p_string}.`);
			return "";
		}
	
		let inputArray = p_string.split("");
		let outputString = "";
		let i;
	
		for (i = 0; i < inputArray.length; i++) {

			if (p_canvasContext.measureText(outputString + inputArray[i] + "...").width > p_maxWidth && outputString != "") {
	
				outputString += "...";
				break;
	
			} else {

				outputString += inputArray[i];
			}
		}
	
		return outputString;
	}

	// Public function for initiating the display of the chart, takes a number for delay in milliseconds.
	startChart(p_delay = 0) {

		this._setDimensions();

		setTimeout(() => {
			this._renderFrame();
			this.CANVAS.addEventListener("mousemove", (evt) => {
				let canvasBounds = this.CANVAS.getBoundingClientRect();
				this._mouseHandler(evt.clientX - canvasBounds.left, evt.clientY - canvasBounds.top);
			});
			
			this.CANVAS.addEventListener("mouseleave", (evt) => {
				this._mouseHandler(0, 0);
			});
		}, p_delay);

		// _cacheToBuffer() is called here, implemented in subclass.
		// This superclass method has to be called at the start of subclass method.
	}

	// Sets the dimensions of the canvas element.
	_setDimensions() {

		// Functionality goes here, implemented in subclass.
	}

	_parseData(p_data, p_sort) {

		if (typeof p_data !== "object") {

			console.log(`ERROR: Cannot prepare data! Was expecting an object but received ${typeof p_data}.`);
			return;
		}

		let data = [];
		let item;
		let i;

		for (item in p_data) {

			if (typeof p_data[item] === "number") {

				data.push({"title": item, "votes": p_data[item]});
				this._totalVotes += p_data[item];

			} else {

				console.log(`ERROR: Value of "${item}" is not a number! It's a ${typeof p_data[item]}. Entry skipped.`);
			}
		}

		if (p_sort != "NONE") {

			data.sort((x, y) => {
				if (p_sort == "DESC") {
					return y.votes - x.votes;
	
				} else if (p_sort == "ASC") {
					return x.votes - y.votes;
				}
			});
		}

		this._dataSet = data;
	}

	_parseColorScheme(p_colorScheme) {

		let colorStep = p_colorScheme.length / (this._dataSet.length + 1);
		let i;

		if (p_colorScheme.length < this._dataSet.length) {
			console.log("WARNING: Chosen color set for chart contains less colors than entries in data. \n Data entries in chart may not be clearly differentiated.");
		}

		for (i = 0; i < this._dataSet.length; i++) {
			this._colorArray.push(p_colorScheme[Math.floor((i + 1) * colorStep)]);
		}
	}

	// Populate _cachedInfo object and draw to buffers. cache and draw methods have to be specified.
	_cacheToBuffer(p_newCacheName, p_cacheMethod, p_drawMethod, p_hitboxMethod = null, p_numOfItems = NaN) {

		let currBufferWidth = 0;
		let currBufferHeight = 0;
		let totalIterations;
		let i;

		this._cachedInfo[p_newCacheName] = [];
		this._buffer[p_newCacheName] = {};

		if (isNaN(p_numOfItems) || p_numOfItems == 0) {
			totalIterations = this._dataSet.length;
				
		} else {
			totalIterations = p_numOfItems;
		}
	
		for (i = 0; i < totalIterations; i++) {

			this._cachedInfo[p_newCacheName].push(p_cacheMethod(i));

			if (this._cachedInfo[p_newCacheName][i]) {

				currBufferWidth = Math.max(currBufferWidth, this._cachedInfo[p_newCacheName][i].x + this._cachedInfo[p_newCacheName][i].w);
				currBufferHeight = Math.max(currBufferHeight, this._cachedInfo[p_newCacheName][i].y + this._cachedInfo[p_newCacheName][i].h);
	
				if (p_hitboxMethod !== null) {
	
					this._mouseTargets.push({
						"checkHitbox": p_hitboxMethod,
						"cacheName": p_newCacheName,
						"index": i
					});
				}
			}
		}

		currBufferWidth += this.BUFFER_PADDING * 0.5;
		currBufferHeight += this.BUFFER_PADDING * 0.5;

		this._buffer[p_newCacheName].canvas = document.createElement("canvas");
		this._buffer[p_newCacheName].canvas.width = currBufferWidth;
		this._buffer[p_newCacheName].canvas.height = currBufferHeight;
		this._buffer[p_newCacheName].context = this._buffer[p_newCacheName].canvas.getContext("2d");

		// DEBUG DRAW:
		// document.body.appendChild(this._buffer[p_newCacheName].canvas);
		// this._buffer[p_newCacheName].canvas.style.background = "#7F7F7F";

		p_drawMethod(this._buffer[p_newCacheName].context);
	}

	// Redraw buffer for specified cache with specified draw method.
	_redrawBuffer(p_cacheName, p_drawMethod) {

		let i;

		for (i = 0; i < this._cachedInfo[p_cacheName].length; i++) {

			this._buffer[p_cacheName].context.clearRect(
				this._cachedInfo[p_cacheName][i].x,
				this._cachedInfo[p_cacheName][i].y,
				this._cachedInfo[p_cacheName][i].w,
				this._cachedInfo[p_cacheName][i].h
			);
		}

		p_drawMethod(this._buffer[p_cacheName].context);
	}

	// Cache and draw methods go here, implemented in subclass.

	// Hitbox methods go here, implemented in subclass.

	// Animates values if needed.
	_animate() {

		// Functionality goes here, implemented in subclass.
	}

	// Performs final render onto the main canvas element visible to user.
	_renderFrame() {

		this._timeDelta = this._lastTimePassed != 0 ? (Date.now() - this._lastTimePassed) * 0.06 : 1;
		this._lastTimePassed = Date.now();

		this._animate();

		if (!this._animIsAsleep) {
			window.requestAnimationFrame(this._renderFrame.bind(this));

		} else {
			this._lastTimePassed = 0;
		}

		// Functionality goes here, implemented in subclass.
		// This superclass method has to be called at the start of subclass method.
	}

	// Mouse input listener.
	_mouseHandler(p_mouseX, p_mouseY) {

		if (this._dataSet == null) return;

		let i;

		this._mouseX = p_mouseX;
		this._mouseY = p_mouseY;

		for (i = 0; i < this._mouseTargets.length; i++) {

			if (this._mouseTargets[i].checkHitbox(this._mouseTargets[i].cacheName, this._mouseTargets[i].index)) {

				if (this._selectedIndex != this._mouseTargets[i].index) {

					this._selectedIndex = this._mouseTargets[i].index;
					if (this._animIsAsleep) this._renderFrame();
				}

				return;
			}
		}

		if (!isNaN(this._selectedIndex)) {
			
			this._selectedIndex = NaN;
			if (this._animIsAsleep) this._renderFrame();
		}
	}
}

class RowChart extends Charter {

	constructor(p_canvasId, p_data, p_colorScheme = null, p_rowHeight = 24, p_sort = "NONE") {

		super(p_canvasId, p_data, p_colorScheme, p_sort);

		// Define constants
		this.ROW_HEIGHT = p_rowHeight;
		
		// Define private variables
		this._currentAnimTime = 0;
		this._introAlpha = 0;
		this._intervalAlpha = 1;
		this._activeIntervalPos = 0;
		this._activeIntervalDraw = false;
		this._highestVotes = 0;
		this._totalRowHeight = 0;
		this._numOfIntervals = NaN;
		this._intervalStep = NaN;

		// Public settings
		this.sidePadding = 20;
		this.bottomPadding = 10;
		this.rowPadding = 16;
		
		this.titlePadding = 12;
		this.titleFontSize = 14;

		this.percentNumSize = 16;
		this.percentNumPadding = 6;

		this.sideIndentSize = 10;

		this.disableIntervals = false;
		this.intervalDashSize = [2, 8];
		this.intervalNumSize = 12;
		this.intervalNumPadding = 6;
		this.desiredNumOfIntervals = 5;

		this.animDelayInterval = 0.1;
		this.animLinearConstant = 25;
		this.animEase = 5;
	}

	startChart(p_delay = 0) {

		super.startChart(p_delay);

		let i;

		for (i = 0; i < this._dataSet.length; i++) {
			this._highestVotes = Math.max(this._highestVotes, this._dataSet[i].votes);
		}

		if (this._highestVotes == 0) {
			this._highestVotes = 1;
		}

		if (!this.disableIntervals) {

			i = 0;

			while (this._highestVotes % (this.desiredNumOfIntervals + i) != 0) {

				if (i <= 0) {
					i *= -1;
					i++;

				} else {
					i *= -1;
				}
			}

			this._numOfIntervals = this.desiredNumOfIntervals + i;
			this._intervalStep = this._highestVotes / this._numOfIntervals;

			this._cacheToBuffer("intervalNum", this._cacheIntervalNum.bind(this), this._drawIntervalNum.bind(this), null, this._numOfIntervals + 1);
			this._cacheToBuffer("dashLine", this._cacheDashLine.bind(this), this._drawDashLine.bind(this), null, 1);
		}

		this._cacheToBuffer("activeIntervalStr", this._cacheActiveIntervalStr.bind(this), this._drawActiveIntervalStr.bind(this));
		this._cacheToBuffer("activeDashLine", this._cacheDashLine.bind(this), this._drawDashLine.bind(this), null, 1);
		this._cacheToBuffer("sideBorder", this._cacheSideBorder.bind(this), this._drawSideBorder.bind(this), null, 1);
		this._cacheToBuffer("bottomBorder", this._cacheBottomBorder.bind(this), this._drawBottomBorder.bind(this), null, 1);
		this._cacheToBuffer("voteBar", this._cacheVoteBar.bind(this), this._drawVoteBar.bind(this), this._voteBarHitbox.bind(this));
		this._cacheToBuffer("title", this._cacheTitle.bind(this), this._drawTitle.bind(this));
		this._cacheToBuffer("percentNum", this._cachePercentNum.bind(this), this._drawPercentNum.bind(this));
	}

	_setDimensions() {
		// The width of the Row Chart element should be determined by its container.

		this._totalRowHeight = this.rowPadding + this.titleFontSize + this.titlePadding + this.ROW_HEIGHT;

		if (!this.disableIntervals) {
			this._height = this._totalRowHeight * this._dataSet.length + this.bottomPadding + this.intervalNumSize + this.intervalNumPadding * 2;

		} else {
			this._height = this._totalRowHeight * this._dataSet.length + this.bottomPadding;
		}

		this.CANVAS.width = this._width = this.CANVAS.parentNode.clientWidth;
		this.CANVAS.height = this._height = Math.ceil(this._height * 0.5) * 2;
	}

	_cacheSideBorder(p_index) {

		return {
			"x": this.BUFFER_PADDING * 0.5,
			"y": this.BUFFER_PADDING * 0.5,
			"w": 2 + this.sideIndentSize + this.BUFFER_PADDING,
			"h": this._totalRowHeight + this.BUFFER_PADDING,
			"alpha": 0
		};
	}

	_cacheBottomBorder(p_index) {

		if (this.disableIntervals) {
			this.intervalNumSize = this.intervalNumPadding = 0;
		}

		return {
			"x": this.BUFFER_PADDING * 0.5,
			"y": this.BUFFER_PADDING * 0.5,
			"w": this._width + this.BUFFER_PADDING,
			"h": this.bottomPadding + this.intervalNumSize + this.intervalNumPadding * 2 + this.BUFFER_PADDING,
			"alpha": 0
		};
	}

	_cacheIntervalNum(p_index) {

		let intervalNumWidth;
		let posOffset = 0;
		let i;

		this.CONTEXT.font = "bold " + this.intervalNumSize + "px Arial";
		intervalNumWidth = this.CONTEXT.measureText(this._intervalStep * p_index).width;

		for (i = 0; i < this._cachedInfo.intervalNum.length; i++) {
			posOffset += this._cachedInfo.intervalNum[i].w;
		}

		return {
			"x": this.BUFFER_PADDING * 0.5 + posOffset,
			"y": this.BUFFER_PADDING * 0.5,
			"w": intervalNumWidth + this.BUFFER_PADDING,
			"h": this.intervalNumSize + this.BUFFER_PADDING,
			"val": this._intervalStep * p_index,
			"alpha": 0
		};
	}

	_cacheDashLine(p_index) {

		return {
			"x": this.BUFFER_PADDING * 0.5,
			"y": this.BUFFER_PADDING * 0.5,
			"w": 2 + this.BUFFER_PADDING,
			"h": this._totalRowHeight * this._dataSet.length + this.bottomPadding + this.intervalNumSize + this.intervalNumPadding * 2 + this.BUFFER_PADDING,
			"alpha": 0
		};
	}

	_cacheActiveIntervalStr(p_index) {

		let intervalStrWidth;
		let posOffset = 0;
		let i;

		this.CONTEXT.font = "bold " + this.intervalNumSize + "px Arial";
		intervalStrWidth = this.CONTEXT.measureText(this._dataSet[p_index].votes + " " + this.langString_votes).width;

		for (i = 0; i < this._cachedInfo.activeIntervalStr.length; i++) {
			posOffset += this._cachedInfo.activeIntervalStr[i].h;
		}

		return {
			"x": this.BUFFER_PADDING * 0.5,
			"y": this.BUFFER_PADDING * 0.5 + posOffset,
			"w": intervalStrWidth + this.BUFFER_PADDING,
			"h": this.intervalNumSize + this.BUFFER_PADDING,
			"str": this._dataSet[p_index].votes + " " + this.langString_votes,
			"alpha": 0
		};
	}

	_cacheVoteBar(p_index) {

		return {
			"x": this.BUFFER_PADDING * 0.5,
			"y": this.BUFFER_PADDING * 0.5 + p_index * (this.ROW_HEIGHT + this.BUFFER_PADDING),
			"w": (this._width - this.sidePadding) * (this._dataSet[p_index].votes / this._highestVotes) + this.BUFFER_PADDING,
			"h": this.ROW_HEIGHT + this.BUFFER_PADDING,
			"rightSideSpacing": (this._width - this.sidePadding) - (this._width - this.sidePadding) * (this._dataSet[p_index].votes / this._highestVotes),
			"animCompletion": 0
		};
	}

	_cacheTitle(p_index) {

		this.CONTEXT.font = "bold " + this.titleFontSize + "px Arial";
		let strWidth = this.CONTEXT.measureText(this._dataSet[p_index].title).width;

		return {
			"x": this.BUFFER_PADDING * 0.5,
			"y": this.BUFFER_PADDING * 0.5 + p_index * (this.titleFontSize + this.BUFFER_PADDING),
			"w": strWidth + this.BUFFER_PADDING,
			"h": this.titleFontSize + this.BUFFER_PADDING,
			"str": this._dataSet[p_index].title,
			"alpha": 0
		};
	}

	_cachePercentNum(p_index) {

		this.CONTEXT.font = "bold " + this.percentNumSize + "px Arial";
		let strVal = (this._totalVotes != 0 ? Math.round((this._dataSet[p_index].votes / this._totalVotes) * 100) : 0) + "%";
		let strWidth = this.CONTEXT.measureText(strVal).width;

		return {
			"x": this.BUFFER_PADDING * 0.5,
			"y": this.BUFFER_PADDING * 0.5 + p_index * (this.percentNumSize + this.BUFFER_PADDING),
			"w": strWidth + this.BUFFER_PADDING,
			"h": this.percentNumSize + this.BUFFER_PADDING,
			"val": strVal
		};
	}

	_cacheSlideInfo(p_index) {

		// Implement functionality.
	}

	_drawSideBorder(p_buffCtx) {

		p_buffCtx.strokeStyle = "#0007";
		p_buffCtx.lineJoin = "miter";
		p_buffCtx.lineCap = "butt";
		p_buffCtx.lineWidth = 2;

		p_buffCtx.moveTo(
			this._cachedInfo.sideBorder[0].x + this.BUFFER_PADDING * 0.5 + 1,
			this._cachedInfo.sideBorder[0].y + this._cachedInfo.sideBorder[0].h - this.BUFFER_PADDING * 0.5
		);

		p_buffCtx.lineTo(
			this._cachedInfo.sideBorder[0].x + this.BUFFER_PADDING * 0.5 + 1,
			this._cachedInfo.sideBorder[0].y + this.BUFFER_PADDING * 0.5 + 1
		);

		p_buffCtx.lineTo(
			this._cachedInfo.sideBorder[0].x + this.BUFFER_PADDING * 0.5 + this.sideIndentSize,
			this._cachedInfo.sideBorder[0].y + this.BUFFER_PADDING * 0.5 + 1
		);

		p_buffCtx.stroke();
	}

	_drawBottomBorder(p_buffCtx) {

		p_buffCtx.strokeStyle = "#0007";
		p_buffCtx.lineJoin = "miter";
		p_buffCtx.lineCap = "butt";
		p_buffCtx.lineWidth = 2;

		p_buffCtx.beginPath();
		p_buffCtx.moveTo(
			this._cachedInfo.bottomBorder[0].x + this.BUFFER_PADDING * 0.5 + 1,
			this._cachedInfo.bottomBorder[0].y + this.BUFFER_PADDING * 0.5
		);

		p_buffCtx.lineTo(
			this._cachedInfo.bottomBorder[0].x + this.BUFFER_PADDING * 0.5 + 1,
			this._cachedInfo.bottomBorder[0].y + this._cachedInfo.bottomBorder[0].h - this.BUFFER_PADDING * 0.5 - 1
		);

		p_buffCtx.lineTo(
			this._cachedInfo.bottomBorder[0].w - this.BUFFER_PADDING * 0.5,
			this._cachedInfo.bottomBorder[0].y + this._cachedInfo.bottomBorder[0].h - this.BUFFER_PADDING * 0.5 - 1
		);

		p_buffCtx.stroke();
	}

	_drawIntervalNum(p_buffCtx) {

		let i;

		p_buffCtx.font = "bold " + this.intervalNumSize + "px Arial";
		p_buffCtx.textAlign = "center";
		p_buffCtx.textBaseline = "middle";
		p_buffCtx.fillStyle = "#0007";
		
		for (i = 0; i < this._cachedInfo.intervalNum.length; i++) {
			p_buffCtx.fillText(
				this._cachedInfo.intervalNum[i].val,
				Math.round(this._cachedInfo.intervalNum[i].x + (this._cachedInfo.intervalNum[i].w * 0.5)),
				Math.round(this._cachedInfo.intervalNum[i].y + (this._cachedInfo.intervalNum[i].h * 0.5))
			);
		}
	}

	_drawDashLine(p_buffCtx) {

		p_buffCtx.strokeStyle = "#0007";
		p_buffCtx.lineJoin = "miter";
		p_buffCtx.lineCap = "butt";
		p_buffCtx.lineWidth = 2;

		p_buffCtx.beginPath();
		p_buffCtx.moveTo(
			this._cachedInfo.dashLine[0].x + this.BUFFER_PADDING * 0.5 + 1,
			this._cachedInfo.dashLine[0].y + this._cachedInfo.dashLine[0].h - this.BUFFER_PADDING * 0.5
		);

		p_buffCtx.lineTo(
			this._cachedInfo.dashLine[0].x + this.BUFFER_PADDING * 0.5 + 1,
			this._cachedInfo.dashLine[0].y + this._cachedInfo.dashLine[0].h - (this.intervalNumSize + this.intervalNumPadding * 2 + this.BUFFER_PADDING * 0.5)
		);
		p_buffCtx.stroke();
		
		p_buffCtx.beginPath();
		p_buffCtx.moveTo(
			this._cachedInfo.dashLine[0].x + this.BUFFER_PADDING * 0.5 + 1,
			this._cachedInfo.dashLine[0].y + this._cachedInfo.dashLine[0].h - (this.intervalNumSize + this.intervalNumPadding * 2 + this.BUFFER_PADDING * 0.5)
		);
		p_buffCtx.lineTo(
			this._cachedInfo.dashLine[0].x + this.BUFFER_PADDING * 0.5 + 1,
			this._cachedInfo.dashLine[0].y + this.BUFFER_PADDING * 0.5
		);
		p_buffCtx.setLineDash(this.intervalDashSize);
		p_buffCtx.stroke();
	}

	_drawActiveIntervalStr(p_buffCtx) {

		let i;

		p_buffCtx.font = "bold " + this.intervalNumSize + "px Arial";
		p_buffCtx.textAlign = "center";
		p_buffCtx.textBaseline = "middle";
		p_buffCtx.fillStyle = "#0007";
		
		for (i = 0; i < this._cachedInfo.activeIntervalStr.length; i++) {
			p_buffCtx.fillText(
				this._cachedInfo.activeIntervalStr[i].str,
				Math.round(this._cachedInfo.activeIntervalStr[i].x + (this._cachedInfo.activeIntervalStr[i].w * 0.5)),
				Math.round(this._cachedInfo.activeIntervalStr[i].y + (this._cachedInfo.activeIntervalStr[i].h * 0.5))
			);
		}
	}

	_drawVoteBar(p_buffCtx) {

		let i;

		for (i = 0; i < this._cachedInfo.voteBar.length; i++) {

			p_buffCtx.fillStyle = this._colorArray[i];
			p_buffCtx.beginPath();
			p_buffCtx.rect(
				this._cachedInfo.voteBar[i].x + this.BUFFER_PADDING * 0.5,
				this._cachedInfo.voteBar[i].y + this.BUFFER_PADDING * 0.5,
				(this._cachedInfo.voteBar[i].w - this.BUFFER_PADDING) * this._cachedInfo.voteBar[i].animCompletion,
				this._cachedInfo.voteBar[i].h - this.BUFFER_PADDING
			);

			p_buffCtx.fill();
		}
	}

	_drawTitle(p_buffCtx) {

		let i;

		p_buffCtx.font = "bold " + this.titleFontSize + "px Arial";
		p_buffCtx.textBaseline = "left";
		p_buffCtx.textAlign = "alphabetic";
		
		for (i = 0; i < this._cachedInfo.title.length; i++) {

			p_buffCtx.fillText(
				this._cachedInfo.title[i].str,
				this._cachedInfo.title[i].x + this.BUFFER_PADDING * 0.5,
				this._cachedInfo.title[i].y + this.BUFFER_PADDING * 0.5 + this.titleFontSize
			);
		}
	}

	_drawPercentNum(p_buffCtx) {

		let i;

		p_buffCtx.font = "bold " + this.percentNumSize + "px Arial";
		p_buffCtx.textBaseline = "middle";
		p_buffCtx.textAlign = "center";
		p_buffCtx.shadowColor = "#0008";
		p_buffCtx.shadowOffsetY = 1;
		
		for (i = 0; i < this._cachedInfo.percentNum.length; i++) {

			if (this.percentNumPadding >= 0) {

				if (this.sidePadding + this._cachedInfo.percentNum[i].w - this.BUFFER_PADDING >= this._cachedInfo.voteBar[i].rightSideSpacing) {
					p_buffCtx.fillStyle = "#FFF";
	
				} else {
					p_buffCtx.fillStyle = this._colorArray[i];
				}

			} else {

				if (this.sidePadding + this._cachedInfo.percentNum[i].w - this.BUFFER_PADDING >= this._cachedInfo.voteBar[i].w - this.BUFFER_PADDING) {
					p_buffCtx.fillStyle = this._colorArray[i];

				} else {
					p_buffCtx.fillStyle = "#FFF";
				}
			}

			p_buffCtx.fillText(
				this._cachedInfo.percentNum[i].val,
				this._cachedInfo.percentNum[i].x + this._cachedInfo.percentNum[i].w * 0.5,
				this._cachedInfo.percentNum[i].y + this._cachedInfo.percentNum[i].h * 0.5
			);
		}
	}

	_drawSlideInfo(p_buffCtx) {

		// Implement draw function.
	}

	_voteBarHitbox(p_cacheName, p_index) {

		if (this._mouseX >= this.sidePadding) {

			if (this._mouseY >= this._totalRowHeight * p_index &&
			this._mouseY < this._totalRowHeight * (p_index + 1)) {

				return true;
			}
		}

		return false;
	}

	_animate() {

		let voteBarsDoneNum = 0;
		let selectedPosX;
		let i;
		
		this._animIsAsleep = true;

		for (i = 0; i < this._cachedInfo.voteBar.length; i++) {

			if (this._cachedInfo.voteBar[i].animCompletion < 0.999) {

				if (this._currentAnimTime >= this.animDelayInterval * i) {

					this._cachedInfo.voteBar[i].animCompletion += Math.min(
						this.animLinearConstant / (this._cachedInfo.voteBar[i].w - this.BUFFER_PADDING),
						(1 - this._cachedInfo.voteBar[i].animCompletion) / this.animEase
					) * this._timeDelta;
				}

				this._animIsAsleep = false;

			} else if (this._cachedInfo.voteBar[i].animCompletion >= 0.999 && this._cachedInfo.voteBar[i].animCompletion != 1) {
				this._cachedInfo.voteBar[i].animCompletion = 1;

			} else {
				voteBarsDoneNum++;
			}
		}

		if (this._introAlpha < 1) {

			this._introAlpha += this._timeDelta / 30; // Hardcoded value of 30 frames, change this.
			this._animIsAsleep = false;

		} else {
			this._introAlpha = 1;
		}

		if (this._introAlpha == 1) {
			if (!isNaN(this._selectedIndex) && this._cachedInfo.activeDashLine[0].alpha == 0) {

				this._activeIntervalPos = this._width - this._cachedInfo.voteBar[this._selectedIndex].rightSideSpacing;
				this._cachedInfo.activeDashLine[0].alpha = 0.01;
				this._activeIntervalDraw = true;
				this._animIsAsleep = false;

			} else if (!isNaN(this._selectedIndex) && this._cachedInfo.activeDashLine.alpha != 0) {

				selectedPosX = this._width - this._cachedInfo.voteBar[this._selectedIndex].rightSideSpacing;

				if (this._activeIntervalPos < selectedPosX - 0.01 || this._activeIntervalPos > selectedPosX + 0.01) {

					this._activeIntervalPos += ((selectedPosX - this._activeIntervalPos) / this.animEase) * this._timeDelta;
					this._animIsAsleep = false;

				} else {
					this._activeIntervalPos = selectedPosX;
				}

				if (this._cachedInfo.activeDashLine[0].alpha < 0.99) {
					this._cachedInfo.activeDashLine[0].alpha += ((1 - this._cachedInfo.activeDashLine[0].alpha) / this.animEase) * this._timeDelta;
					this._intervalAlpha = (1 - this._cachedInfo.activeDashLine[0].alpha);
					this._animIsAsleep = false;

				} else {
					this._cachedInfo.activeDashLine[0].alpha = 1;
					this._intervalAlpha = 0;
				}

			} else if (isNaN(this._selectedIndex) && this._cachedInfo.activeDashLine[0].alpha != 0) {

				if (this._cachedInfo.activeDashLine[0].alpha > 0.01) {
					this._cachedInfo.activeDashLine[0].alpha -= (this._cachedInfo.activeDashLine[0].alpha / this.animEase) * this._timeDelta;
					this._intervalAlpha = (1 - this._cachedInfo.activeDashLine[0].alpha);
					this._animIsAsleep = false;

				} else {
					this._cachedInfo.activeDashLine[0].alpha = 0;
					this._intervalAlpha = 1;
					this._activeIntervalDraw = false;
				}
			}

			if (!isNaN(this._selectedIndex)) {
				this._cachedInfo.activeIntervalStr[this._selectedIndex].alpha = this._cachedInfo.activeDashLine[0].alpha;
			}

			for (i = 0; i < this._cachedInfo.activeIntervalStr.length; i++) {

				if (i != this._selectedIndex) {
					this._cachedInfo.activeIntervalStr[i].alpha = 0;
				}
			}
		}

		this._currentAnimTime += this._timeDelta / 60;
	}

	_renderFrame() {

		super._renderFrame();

		let intervalStepWidth = ((this._width - this.sidePadding) / this._highestVotes) * this._intervalStep;
		let percentNumX;
		let currentBarX;
		let i;

		this.CONTEXT.clearRect(0, 0, this._width, this._height);

		for (i = 0; i < this._cachedInfo.voteBar.length; i++) {

			if (this._cachedInfo.voteBar[i].animCompletion != 1) {

				this._redrawBuffer("voteBar", this._drawVoteBar.bind(this));
				break;
			}
		}

		this.CONTEXT.globalAlpha = this._introAlpha;

		this.CONTEXT.drawImage(
			this._buffer.bottomBorder.canvas,
			this._cachedInfo.bottomBorder[0].x,
			this._cachedInfo.bottomBorder[0].y,
			this._cachedInfo.bottomBorder[0].w,
			this._cachedInfo.bottomBorder[0].h,
			this.BUFFER_PADDING * -0.5,
			this._totalRowHeight * this._dataSet.length - this.BUFFER_PADDING * 0.5,
			this._cachedInfo.bottomBorder[0].w,
			this._cachedInfo.bottomBorder[0].h
		);

		if (!this.disableIntervals) {

			this.CONTEXT.globalAlpha = this._introAlpha * this._intervalAlpha;

			for (i = 0; i < this._cachedInfo.intervalNum.length; i++) {

				if (i != 0) {
					this.CONTEXT.drawImage(
						this._buffer.dashLine.canvas,
						this._cachedInfo.dashLine[0].x,
						this._cachedInfo.dashLine[0].y,
						this._cachedInfo.dashLine[0].w,
						this._cachedInfo.dashLine[0].h,
						Math.floor(this.sidePadding + intervalStepWidth * i - this._cachedInfo.dashLine[0].w * 0.5 - 1),
						this.BUFFER_PADDING * -0.5,
						this._cachedInfo.dashLine[0].w,
						this._cachedInfo.dashLine[0].h
					);
				}
	
				this.CONTEXT.drawImage(
					this._buffer.intervalNum.canvas,
					this._cachedInfo.intervalNum[i].x,
					this._cachedInfo.intervalNum[i].y,
					this._cachedInfo.intervalNum[i].w,
					this._cachedInfo.intervalNum[i].h,
					Math.floor(i == 0 ? this.sidePadding - this.BUFFER_PADDING * 0.5 : this.sidePadding + intervalStepWidth * i - (this._cachedInfo.intervalNum[i].w - this.BUFFER_PADDING * 0.5) - this.intervalNumPadding - 1),
					Math.floor(this._height - this.intervalNumSize - this.intervalNumPadding - this.BUFFER_PADDING * 0.5),
					this._cachedInfo.intervalNum[i].w,
					this._cachedInfo.intervalNum[i].h
				);
			}
		}

		if (this._activeIntervalDraw) {

			this.CONTEXT.globalAlpha = this._cachedInfo.activeDashLine[0].alpha;
			this.CONTEXT.drawImage(
				this._buffer.activeDashLine.canvas,
				this._cachedInfo.activeDashLine[0].x,
				this._cachedInfo.activeDashLine[0].y,
				this._cachedInfo.activeDashLine[0].w,
				this._cachedInfo.activeDashLine[0].h,
				this._activeIntervalPos - this._cachedInfo.activeDashLine[0].w * 0.5 - 1,
				this.BUFFER_PADDING * -0.5,
				this._cachedInfo.activeDashLine[0].w,
				this._cachedInfo.activeDashLine[0].h
			);
		}

		for (i = 0; i < this._cachedInfo.voteBar.length; i++) {

			if (this._activeIntervalDraw) {

				this.CONTEXT.globalAlpha = this._cachedInfo.activeIntervalStr[i].alpha;
				this.CONTEXT.drawImage(
					this._buffer.activeIntervalStr.canvas,
					this._cachedInfo.activeIntervalStr[i].x,
					this._cachedInfo.activeIntervalStr[i].y,
					this._cachedInfo.activeIntervalStr[i].w,
					this._cachedInfo.activeIntervalStr[i].h,
					Math.floor(this._cachedInfo.activeIntervalStr[i].w - this.BUFFER_PADDING > this._cachedInfo.voteBar[i].rightSideSpacing ? this._activeIntervalPos - this.intervalNumPadding - this._cachedInfo.activeIntervalStr[i].w + this.BUFFER_PADDING - 1 : this._activeIntervalPos + this.intervalNumPadding - this.BUFFER_PADDING * 0.5 - 1),
					this._height - this.intervalNumSize - this.intervalNumPadding - this.BUFFER_PADDING * 0.5,
					this._cachedInfo.activeIntervalStr[i].w,
					this._cachedInfo.activeIntervalStr[i].h
				);
			}

			this.CONTEXT.globalAlpha = this._introAlpha;

			this.CONTEXT.drawImage(
				this._buffer.sideBorder.canvas,
				this._cachedInfo.sideBorder[0].x,
				this._cachedInfo.sideBorder[0].y,
				this._cachedInfo.sideBorder[0].w,
				this._cachedInfo.sideBorder[0].h,
				this.BUFFER_PADDING * -0.5,
				this._totalRowHeight * i - this.BUFFER_PADDING * 0.5,
				this._cachedInfo.sideBorder[0].w,
				this._cachedInfo.sideBorder[0].h
			);

			this.CONTEXT.globalAlpha = this._cachedInfo.voteBar[i].animCompletion;

			this.CONTEXT.drawImage(
				this._buffer.title.canvas,
				this._cachedInfo.title[i].x,
				this._cachedInfo.title[i].y,
				this._cachedInfo.title[i].w,
				this._cachedInfo.title[i].h,
				this.sidePadding - this.BUFFER_PADDING * 0.5,
				this._totalRowHeight * i + this.rowPadding * 0.5 - this.BUFFER_PADDING * 0.5,
				this._cachedInfo.title[i].w,
				this._cachedInfo.title[i].h
			);

			this.CONTEXT.globalAlpha = 1;

			this.CONTEXT.drawImage(
				this._buffer.voteBar.canvas,
				this._cachedInfo.voteBar[i].x,
				this._cachedInfo.voteBar[i].y,
				this._cachedInfo.voteBar[i].w,
				this._cachedInfo.voteBar[i].h,
				this.sidePadding - this.BUFFER_PADDING * 0.5,
				this._totalRowHeight * i + this.rowPadding * 0.5 + this.titleFontSize + this.titlePadding - this.BUFFER_PADDING * 0.5,
				this._cachedInfo.voteBar[i].w,
				this._cachedInfo.voteBar[i].h
			);

			currentBarX = this.sidePadding + (this._cachedInfo.voteBar[i].w - this.BUFFER_PADDING) * this._cachedInfo.voteBar[i].animCompletion;
			this.CONTEXT.globalAlpha = this._cachedInfo.voteBar[i].animCompletion;

			if (this.percentNumPadding >= 0) {

				if (this.percentNumPadding + this._cachedInfo.percentNum[i].w - this.BUFFER_PADDING >= this._cachedInfo.voteBar[i].rightSideSpacing) {
					percentNumX = currentBarX - this.percentNumPadding - (this._cachedInfo.percentNum[i].w - this.BUFFER_PADDING);
	
				} else {
					percentNumX = currentBarX + this.percentNumPadding - this.BUFFER_PADDING * 0.5;
				}

			} else {

				if (Math.abs(this.percentNumPadding) * 2 + this._cachedInfo.percentNum[i].w - this.BUFFER_PADDING >= this._cachedInfo.voteBar[i].w - this.BUFFER_PADDING) {
					percentNumX = currentBarX - this.percentNumPadding - this.BUFFER_PADDING * 0.5;

				} else {
					percentNumX = currentBarX + this.percentNumPadding - (this._cachedInfo.percentNum[i].w - this.BUFFER_PADDING);
				}
			}

			this.CONTEXT.drawImage(
				this._buffer.percentNum.canvas,
				this._cachedInfo.percentNum[i].x,
				this._cachedInfo.percentNum[i].y,
				this._cachedInfo.percentNum[i].w,
				this._cachedInfo.percentNum[i].h,
				percentNumX,
				this._totalRowHeight * i + this.rowPadding * 0.5 + this.titleFontSize + this.titlePadding + (this.ROW_HEIGHT - this._cachedInfo.percentNum[i].h) * 0.5,
				this._cachedInfo.percentNum[i].w,
				this._cachedInfo.percentNum[i].h
			);
		}
	}
}

class ColumnChart extends Charter {

	constructor(p_canvasId, p_data, p_colorScheme, p_sort = "NONE") {

		super(p_canvasId, p_data, p_colorScheme, p_sort);

		// Define constants
		
		// Define private variables

		// Public settings

	}

	startChart(p_delay = 0) {

		super.startChart(p_delay);
		// Implement functionality.
	}

	_setDimensions() {
		// Implement functionality.
	}

	// Cache and draw methods go here.

	// Hitbox methods go here.

	_animate() {
		// Implement functionality.
	}

	_renderFrame() {

		super._renderFrame();
		// Implement functionality.
	}
}

class LineChart extends Charter {

	constructor(p_canvasId, p_data, p_colorScheme, p_rowHeight, p_sort = "NONE") {

		super(p_canvasId, p_data, p_colorScheme, p_sort);

		// Define constants
		this.ROW_HEIGHT = p_rowHeight;
		
		// Define private variables

		// Public settings

	}

	startChart(p_delay = 0) {

		super.startChart(p_delay);
		// Implement functionality.
	}

	_setDimensions() {
		// Implement functionality.
	}

	// Cache and draw methods go here.

	// Hitbox methods go here.

	_animate() {
		// Implement functionality.
	}

	_renderFrame() {
		
		super._renderFrame();
		// Implement functionality.
	}
}

class CircleChart extends Charter {

	constructor(p_canvasId, p_data, p_colorScheme = null, p_diameter = 160, p_thickness = 32, p_sort = "DESC") {

		super(p_canvasId, p_data, p_colorScheme, p_sort);

		// Limit thickness parameter.
		if (p_thickness > 100) {
			this.THICKNESS = 100;

		} else if (p_thickness < 10) {
			this.THICKNESS = 10;
			
		} else {
			this.THICKNESS = p_thickness;
		}

		// Define constants
		this.FULL_RAD = Math.PI * 2;
		this.QUART_RAD = Math.PI * 0.5;
		this.DIAMETER = p_diameter;
		this.OUTER_RADIUS = this.DIAMETER * 0.5;
		this.INNER_RADIUS = (1 - (this.THICKNESS * 0.01)) * this.OUTER_RADIUS;

		// Define private variables
		this._circlePosX = this.WIDTH * 0.5;
		this._circlePosY = this.WIDTH * 0.5;
		this._circlePosOffsetX = 0;
		this._circlePosOffsetY = 0;
		this._circleCompletion = 0;
		this._totalCircleDiameter = 0;
		this._voteListHeight = 0;

		// Public settings
		this.circleCompletionEase = 10;
		this.pieceOffsetAmount = 25;
		this.pieceOffsetSmooth = 4;

		this.disablePercentNums = false;

		if (this.THICKNESS == 100) {
			this.disableCenterInfo = true;

		} else {
			this.disableCenterInfo = false;
		}

		this.percentNumFontSize = 16;
		this.percentNumOffset = 20;
		this.centerInfoSizeMult = 0.6;

		this.voteListWidth = 200;
		this.votelistPadding = 8;
		this.voteListFontSize = 12;
		this.voteListOffset = 20;

		this.horizontalPadding = 0;
	}

	startChart(p_delay = 0) {

		super.startChart(p_delay);

		this._cacheToBuffer("circlePiece", this._cacheCirclePieces.bind(this), this._drawCirclePieces.bind(this), this._circlePiecesHitbox.bind(this));

		if (!this.disableCenterInfo) {
			this._cacheToBuffer("centerInfo", this._cacheCenterInfos.bind(this), this._drawCenterInfos.bind(this));
		}

		if (!this.disablePercentNums) {
			this._cacheToBuffer("percentNum", this._cachePercentNums.bind(this), this._drawPercentNums.bind(this));
		}

		this._cacheToBuffer("voteListItem", this._cacheVoteList.bind(this), this._drawVoteList.bind(this), this._voteListHitbox.bind(this));
	}

	_setDimensions() {

		if (this.disablePercentNums) {

			this.percentNumOffset = 0;
			this.percentNumFontSize = 0;
		}

		this._totalCircleDiameter = this.DIAMETER + this.pieceOffsetAmount + (this.percentNumOffset < 0 ? 0 : (this.percentNumOffset + this.percentNumFontSize) * 2);
		this._voteListHeight = (this.voteListFontSize + this.votelistPadding * 2) * this._dataSet.length;

		this._width = Math.max(this.voteListWidth + this.horizontalPadding * 2, this._totalCircleDiameter + this.horizontalPadding * 2);
		this._height = this._totalCircleDiameter + this.voteListOffset + this._voteListHeight;

		this.CANVAS.width = this._width = Math.ceil(this._width * 0.5) * 2;
		this.CANVAS.height = this._height = Math.ceil(this._height * 0.5) * 2;

		this._circlePosX = this._width * 0.5;
		this._circlePosY = this._totalCircleDiameter * 0.5;
	}
	
	_cacheCirclePieces(p_index) {

		if ((this._totalVotes == 0 && p_index != 0) || (this._totalVotes != 0 && this._dataSet[p_index].votes == 0)) {

			return false;

		} else {

			let radOffset = 0;
			let radPercent;
			let vecX;
			let vecY;
			let i;

			for (i = 0; i < this._cachedInfo.circlePiece.length; i++) {

				if (this._cachedInfo.circlePiece[i]) {
					radOffset += this._cachedInfo.circlePiece[i].radPercent;
				}
			}

			if (this._dataSet[p_index].votes == this._totalVotes) {

				radPercent = this.FULL_RAD;
				vecX = 0;
				vecY = 0;

			} else {

				radPercent = (this._dataSet[p_index].votes / this._totalVotes) * this.FULL_RAD;
				vecX = Math.cos(radOffset - this.QUART_RAD + radPercent * 0.5);
				vecY = Math.sin(radOffset - this.QUART_RAD + radPercent * 0.5);
			}

			return {
				"x": (this.BUFFER_PADDING * 0.5) + p_index * (this.DIAMETER + this.BUFFER_PADDING),
				"y": this.BUFFER_PADDING * 0.5,
				"w": this.DIAMETER + this.BUFFER_PADDING,
				"h": this.DIAMETER + this.BUFFER_PADDING,
				"radOffset": radOffset,
				"radPercent": radPercent,
				"vecX": vecX,
				"vecY": vecY,
				"vecLen": 0
			};
		}
	}

	_cacheCenterInfos(p_index) {

		if ((this._totalVotes == 0 && p_index != 0) || (this._totalVotes != 0 && this._dataSet[p_index].votes == 0)) {

			return false;

		} else {

			let targetSize = this.INNER_RADIUS * 2 * this.centerInfoSizeMult;
			let currTextSize = targetSize;
			let currNumSize;
			let measuredWidth;
			let i;

			// Find appropriate size of texts using binary search method, a maximum of 10 iterations should suffice, tolerance of 0.8 pixels.
			for (i = 0; i < 10; i++) {

				this.CONTEXT.font = "bold " + currTextSize + "px Arial";
				measuredWidth = this.CONTEXT.measureText(this.langString_votes.toUpperCase()).width;

				if (currTextSize > (targetSize * 0.5) + 0.4) {
					currTextSize -= targetSize / Math.pow(2, i + 1);
	
				} else if (measuredWidth < targetSize - 0.4) {
					currTextSize += targetSize / Math.pow(2, i + 1);
	
				} else if (measuredWidth > targetSize + 0.4) {
					currTextSize -= targetSize / Math.pow(2, i + 1);

				} else {
					break;
				}
			}

			currNumSize = targetSize - currTextSize;

			for (i = 0; i < 10; i++) {

				this.CONTEXT.font = currNumSize + "px Arial";
				measuredWidth = this.CONTEXT.measureText(this._dataSet[p_index].votes).width;

				if (currNumSize > (targetSize - currTextSize) + 0.4) {
					currNumSize -= targetSize / Math.pow(2, i + 1);

				} else if (measuredWidth < targetSize - 0.4) {
					currNumSize += targetSize / Math.pow(2, i + 1);

				} else if (measuredWidth > targetSize + 0.4) {
					currNumSize -= targetSize / Math.pow(2, i + 1);

				} else {
					break;
				}
			}

			return {
				"x": (this.BUFFER_PADDING * 0.5) + p_index * (targetSize + this.BUFFER_PADDING),
				"y": this.BUFFER_PADDING * 0.5,
				"w": targetSize + this.BUFFER_PADDING,
				"h": targetSize + this.BUFFER_PADDING,
				"textSize": currTextSize,
				"numSize": currNumSize
			};
		}
	}

	_cachePercentNums(p_index) {

		if ((this._totalVotes == 0 && p_index != 0) || (this._totalVotes != 0 && this._dataSet[p_index].votes == 0)) {

			return false;

		} else {

			let percentStr;
			let percentStrWidth;
			let percentStrDiameter;
			let posOffset = 0;
			let i;

			if (this._totalVotes == 0) {
				percentStr = "0%";
	
			} else {
				percentStr = Math.round((this._dataSet[p_index].votes / this._totalVotes) * 100) + "%";
			}
	
			this.CONTEXT.font = "bold " + this.percentNumFontSize + "px Arial";
	
			percentStrWidth = this.CONTEXT.measureText(percentStr).width;
			percentStrDiameter = Math.sqrt(percentStrWidth * percentStrWidth + this.percentNumFontSize * this.percentNumFontSize);

			for (i = 0; i < this._cachedInfo.percentNum.length; i++) {
				posOffset += this._cachedInfo.percentNum[i].w;
			}
	
			return {
				"x": (this.BUFFER_PADDING * 0.5) + posOffset,
				"y": this.BUFFER_PADDING * 0.5,
				"w": percentStrDiameter + this.BUFFER_PADDING,
				"h": percentStrDiameter + this.BUFFER_PADDING,
				"val": percentStr
			};
		}
	}

	_cacheVoteList(p_index) {

		let percentStr;
		let percentStrWidth;
		let voteListStr;
		let i;

		if (this._dataSet[p_index].votes == 0) {
			percentStr = "0%";

		} else {
			percentStr = ((this._dataSet[p_index].votes / this._totalVotes) * 100).toFixed(2) + "%";
		}

		this.CONTEXT.font = this.voteListFontSize + "px Arial";
		percentStrWidth = this.CONTEXT.measureText(percentStr).width;
		voteListStr = this.contractCanvasText(
			this.CONTEXT,
			this._dataSet[p_index].title,
			this.voteListWidth - (this.voteListFontSize + percentStrWidth + (this.votelistPadding * 4))
		);

		return {
			"x": this.BUFFER_PADDING * 0.5,
			"y": (this.BUFFER_PADDING * 0.5) + p_index * (this.voteListFontSize + this.votelistPadding * 2 + this.BUFFER_PADDING),
			"w": this.voteListWidth + this.BUFFER_PADDING,
			"h": (this.voteListFontSize + this.votelistPadding * 2) + this.BUFFER_PADDING,
			"str": voteListStr,
			"val": percentStr,
			"alpha": (this._dataSet[p_index].votes == 0 ? 0.5 : 1)
		};
	}

	_drawCirclePieces(p_buffCtx) {

		let startAngle;
		let endAngle;
		let i;

		for (i = 0; i < this._cachedInfo.circlePiece.length; i++) {

			if (this._cachedInfo.circlePiece[i]) {

				startAngle = this._cachedInfo.circlePiece[i].radOffset * this._circleCompletion - this.QUART_RAD - 0.004;
				endAngle = (this._cachedInfo.circlePiece[i].radOffset + this._cachedInfo.circlePiece[i].radPercent) * this._circleCompletion - this.QUART_RAD + 0.004;

				if (this._totalVotes == 0) {
					p_buffCtx.fillStyle = "#C8C8C8";

				} else {
					p_buffCtx.fillStyle = this._colorArray[i];
				}

				p_buffCtx.beginPath();
				p_buffCtx.arc(
					this._cachedInfo.circlePiece[i].x + this.BUFFER_PADDING * 0.5 + this.OUTER_RADIUS,
					this._cachedInfo.circlePiece[i].y + this.BUFFER_PADDING * 0.5 + this.OUTER_RADIUS,
					this.OUTER_RADIUS,
					startAngle,
					endAngle,
					false
				);

				p_buffCtx.arc(
					this._cachedInfo.circlePiece[i].x + this.BUFFER_PADDING * 0.5 + this.OUTER_RADIUS,
					this._cachedInfo.circlePiece[i].y + this.BUFFER_PADDING * 0.5 + this.OUTER_RADIUS,
					this.INNER_RADIUS,
					endAngle,
					startAngle,
					true
				);

				p_buffCtx.fill();
			}
		}
	}

	_drawCenterInfos(p_buffCtx) {

		let i;

		p_buffCtx.textAlign = "center";
		p_buffCtx.textBaseline = "middle";
		p_buffCtx.shadowColor = "#0008";
		p_buffCtx.shadowOffsetY = 1;

		for (i = 0; i < this._cachedInfo.centerInfo.length; i++) {
			
			if (this._cachedInfo.centerInfo[i]) {

				if (this._totalVotes == 0) {
					p_buffCtx.fillStyle = "#C8C8C8";
	
				} else {
					p_buffCtx.fillStyle = this._colorArray[i];
				}
	
				p_buffCtx.font = this._cachedInfo.centerInfo[i].numSize + "px Arial";
				p_buffCtx.fillText(
					this._dataSet[i].votes,
					this._cachedInfo.centerInfo[i].x + (this._cachedInfo.centerInfo[i].w * 0.5),
					this._cachedInfo.centerInfo[i].y + (this._cachedInfo.centerInfo[i].h - this._cachedInfo.centerInfo[i].textSize) * 0.5
				);
	
				p_buffCtx.font = "bold " + this._cachedInfo.centerInfo[i].textSize + "px Arial";
				p_buffCtx.fillText(
					this.langString_votes.toUpperCase(),
					this._cachedInfo.centerInfo[i].x + (this._cachedInfo.centerInfo[i].w * 0.5),
					this._cachedInfo.centerInfo[i].y + (this._cachedInfo.centerInfo[i].h + this._cachedInfo.centerInfo[i].numSize) * 0.5
				);
			}
		}
	}

	_drawPercentNums(p_buffCtx) {

		let i;

		p_buffCtx.textAlign = "center";
		p_buffCtx.textBaseline = "middle";
		p_buffCtx.font = "bold " + this.percentNumFontSize + "px Arial";
		p_buffCtx.shadowColor = "#0008";
		p_buffCtx.shadowOffsetY = 1;

		for (i = 0; i < this._cachedInfo.percentNum.length; i++) {

			if (this._cachedInfo.percentNum[i]) {

				if ((this.percentNumOffset >= 0 || this.percentNumOffset < this.INNER_RADIUS - this.OUTER_RADIUS) && this._totalVotes == 0) {
					p_buffCtx.fillStyle = "#C8C8C8";

				} else if ((this.percentNumOffset >= 0 || this.percentNumOffset < this.INNER_RADIUS - this.OUTER_RADIUS) && this._totalVotes != 0) {
					p_buffCtx.fillStyle = this._colorArray[i];

				} else {
					p_buffCtx.fillStyle = "#FFF";
				}

				p_buffCtx.fillText(
					this._cachedInfo.percentNum[i].val,
					this._cachedInfo.percentNum[i].x + (this._cachedInfo.percentNum[i].w * 0.5),
					this._cachedInfo.percentNum[i].y + (this._cachedInfo.percentNum[i].h * 0.5)
				);
			}
		}
	}

	_drawVoteList(p_buffCtx) {

		let i;

		p_buffCtx.textBaseline = "middle";

		for (i = 0; i < this._cachedInfo.voteListItem.length; i++) {

			if (i % 2) {
				p_buffCtx.fillStyle = "#0008";

			} else {
				p_buffCtx.fillStyle = "#000A";
			}

			p_buffCtx.beginPath();
			p_buffCtx.rect(
				this._cachedInfo.voteListItem[i].x + this.BUFFER_PADDING * 0.5 + this.votelistPadding + this.voteListFontSize,
				this._cachedInfo.voteListItem[i].y + this.BUFFER_PADDING * 0.5,
				this._cachedInfo.voteListItem[i].w - this.BUFFER_PADDING - (this.votelistPadding + this.voteListFontSize),
				this._cachedInfo.voteListItem[i].h - this.BUFFER_PADDING
			);

			p_buffCtx.fill();
		}

		for (i = 0; i < this._cachedInfo.voteListItem.length; i++) {

			p_buffCtx.fillStyle = this._colorArray[i];
			p_buffCtx.beginPath();
			p_buffCtx.rect(
				this._cachedInfo.voteListItem[i].x + this.BUFFER_PADDING * 0.5,
				this._cachedInfo.voteListItem[i].y + this.BUFFER_PADDING * 0.5,
				this.votelistPadding + this.voteListFontSize,
				this._cachedInfo.voteListItem[i].h - this.BUFFER_PADDING
			);

			p_buffCtx.fill();
		}

		p_buffCtx.fillStyle = "#FFF";
		p_buffCtx.textAlign = "left";
		p_buffCtx.font = this.voteListFontSize + "px Arial";

		for (i = 0; i < this._cachedInfo.voteListItem.length; i++) {

			p_buffCtx.fillText(
				this._cachedInfo.voteListItem[i].str,
				this._cachedInfo.voteListItem[i].x + this.BUFFER_PADDING * 0.5 + this.voteListFontSize + this.votelistPadding * 2,
				this._cachedInfo.voteListItem[i].y + this._cachedInfo.voteListItem[i].h * 0.5
			);
		}

		p_buffCtx.textAlign = "right";
		p_buffCtx.font = "bold " + this.voteListFontSize + "px Arial";
		
		for (i = 0; i < this._cachedInfo.voteListItem.length; i++) {

			p_buffCtx.fillText(
				this._cachedInfo.voteListItem[i].val,
				this._cachedInfo.voteListItem[i].x + this.BUFFER_PADDING * 0.5 + this.voteListWidth - this.votelistPadding,
				this._cachedInfo.voteListItem[i].y + this._cachedInfo.voteListItem[i].h * 0.5
			);
		}
	}

	_circlePiecesHitbox(p_cacheName, p_index) {
	
		let mouseOffsetX = (this._mouseX - (this._circlePosX + this._circlePosOffsetX));
		let mouseOffsetY = (this._mouseY - (this._circlePosY + this._circlePosOffsetY));
		let mouseAngle = Math.atan2(-mouseOffsetX, mouseOffsetY) + Math.PI;
		let mouseLen = mouseOffsetX * mouseOffsetX + mouseOffsetY * mouseOffsetY;
		let circleLen;

		if (this._dataSet[p_index].votes == this._totalVotes) {
			circleLen = this.OUTER_RADIUS * this.OUTER_RADIUS;

		} else {
			circleLen = (this._cachedInfo[p_cacheName][p_index].vecLen + this.OUTER_RADIUS) * (this._cachedInfo[p_cacheName][p_index].vecLen + this.OUTER_RADIUS);
		}

		if (mouseLen <= circleLen && mouseLen >= this.INNER_RADIUS * this.INNER_RADIUS) {
			if (mouseAngle >= this._cachedInfo[p_cacheName][p_index].radOffset) {
				if(mouseAngle < this._cachedInfo[p_cacheName][p_index].radOffset + this._cachedInfo[p_cacheName][p_index].radPercent) {

					return true;
				}
			}
		}

		return false;
	}

	_voteListHitbox(p_cacheName, p_index) {

		if (this._mouseX >= (this._width - this.voteListWidth) * 0.5 &&
		this._mouseX < this._width - (this._width - this.voteListWidth) * 0.5) {

			if (this._mouseY >= this._totalCircleDiameter + this.voteListOffset + (this._voteListHeight / this._dataSet.length) * p_index &&
			this._mouseY < this._totalCircleDiameter + this.voteListOffset + (this._voteListHeight / this._dataSet.length) * (p_index + 1)) {
					
				return true;
			}
		}

		return false;
	}

	_animate() {
		
		this._animIsAsleep = false;

		if (this._circleCompletion < 0.999) {

			this._circleCompletion += ((1 - this._circleCompletion) / this.circleCompletionEase) * this._timeDelta;
			this._redrawBuffer("circlePiece", this._drawCirclePieces.bind(this));
	
		} else if (this._circleCompletion >= 0.999 && this._circleCompletion != 1) {

			this._circleCompletion = 1;
			this._redrawBuffer("circlePiece", this._drawCirclePieces.bind(this));
	
		} else {
	
			let vecBoundLeft = 0;
			let vecBoundRight = 0;
			let vecBoundUp = 0;
			let vecBoundDown = 0;

			let isComplete = true;

			let i;
	
			if (!isNaN(this._selectedIndex)) {
				if (this._cachedInfo.circlePiece[this._selectedIndex]) {
					if (this._cachedInfo.circlePiece[this._selectedIndex].vecLen < this.pieceOffsetAmount - 0.01) {

						this._cachedInfo.circlePiece[this._selectedIndex].vecLen += ((this.pieceOffsetAmount - this._cachedInfo.circlePiece[this._selectedIndex].vecLen) / this.pieceOffsetSmooth) * this._timeDelta;
						isComplete = false;
			
					} else {
						this._cachedInfo.circlePiece[this._selectedIndex].vecLen = this.pieceOffsetAmount;
					}
				}

				if (this._dataSet[this._selectedIndex].votes != 0) {
					if (this._cachedInfo.voteListItem[this._selectedIndex].alpha < 0.99) {

						this._cachedInfo.voteListItem[this._selectedIndex].alpha += ((1 - this._cachedInfo.voteListItem[this._selectedIndex].alpha) / this.pieceOffsetSmooth) * this._timeDelta;
						isComplete = false;
	
					} else {
						this._cachedInfo.voteListItem[this._selectedIndex].alpha = 1;
					}
				}
			}
	
			for (i = 0; i < this._dataSet.length; i++) {

				if (i !== this._selectedIndex) {
					if (this._cachedInfo.circlePiece[i]) {
						if (this._cachedInfo.circlePiece[i].vecLen > 0.01) {
	
							this._cachedInfo.circlePiece[i].vecLen -= (this._cachedInfo.circlePiece[i].vecLen / this.pieceOffsetSmooth) * this._timeDelta;
							isComplete = false;
		
						} else {
	
							this._cachedInfo.circlePiece[i].vecLen = 0;
						}
					}

					if (this._dataSet[i].votes != 0) {
						if (!isNaN(this._selectedIndex) && this._dataSet[this._selectedIndex].votes != 0) {
							if (this._cachedInfo.voteListItem[i] && this._cachedInfo.voteListItem[i].alpha > 0.51) {
	
								this._cachedInfo.voteListItem[i].alpha -= ((this._cachedInfo.voteListItem[i].alpha) / this.pieceOffsetSmooth) * this._timeDelta;
								isComplete = false;
	
							} else if (this._cachedInfo.voteListItem[i]) {

								this._cachedInfo.voteListItem[i].alpha = 0.5;
							}

						} else {
							if (this._cachedInfo.voteListItem[i] && this._cachedInfo.voteListItem[i].alpha < 0.99) {
	
								this._cachedInfo.voteListItem[i].alpha += ((1 - this._cachedInfo.voteListItem[i].alpha) / this.pieceOffsetSmooth) * this._timeDelta;
								isComplete = false;
			
							} else if (this._cachedInfo.voteListItem[i]) {

								this._cachedInfo.voteListItem[i].alpha = 1;
							}
						}
					}
				}
				
				if (this._cachedInfo.circlePiece[i]) {

					vecBoundLeft = Math.min(vecBoundLeft, this._cachedInfo.circlePiece[i].vecX * this._cachedInfo.circlePiece[i].vecLen);
					vecBoundRight = Math.max(vecBoundRight, this._cachedInfo.circlePiece[i].vecX * this._cachedInfo.circlePiece[i].vecLen);
					vecBoundUp = Math.min(vecBoundUp, this._cachedInfo.circlePiece[i].vecY * this._cachedInfo.circlePiece[i].vecLen);
					vecBoundDown = Math.max(vecBoundDown, this._cachedInfo.circlePiece[i].vecY * this._cachedInfo.circlePiece[i].vecLen);
				}
				
				if (this._totalVotes == 0) {
					break;
				}
			}
	
			this._circlePosOffsetX = (vecBoundLeft + vecBoundRight) * -0.5;
			this._circlePosOffsetY = (vecBoundUp + vecBoundDown) * -0.5;
	
			if (isComplete) {
				this._animIsAsleep = true;
			}
		}
	}

	_renderFrame() {

		super._renderFrame();

		let relCirclePosX = this._circlePosX + this._circlePosOffsetX;
		let relCirclePosY = this._circlePosY + this._circlePosOffsetY;
		let currVecX;
		let currVecY;
		let currVecLen;
		let currNumDiameter;
		let currArcLength;
		let i;
		
		this.CONTEXT.clearRect(0, 0, this._width, this._height);

		for (i = 0; i < this._dataSet.length; i++) {

			// Draw Circle
			if (this._cachedInfo.circlePiece[i] != false) {

				this.CONTEXT.drawImage(
					this._buffer.circlePiece.canvas,
					this._cachedInfo.circlePiece[i].x,
					this._cachedInfo.circlePiece[i].y,
					this._cachedInfo.circlePiece[i].w,
					this._cachedInfo.circlePiece[i].h,
					relCirclePosX + (this._cachedInfo.circlePiece[i].vecX * this._cachedInfo.circlePiece[i].vecLen) - (this._cachedInfo.circlePiece[i].w * 0.5),
					relCirclePosY + (this._cachedInfo.circlePiece[i].vecY * this._cachedInfo.circlePiece[i].vecLen) - (this._cachedInfo.circlePiece[i].h * 0.5),
					this._cachedInfo.circlePiece[i].w,
					this._cachedInfo.circlePiece[i].h
				);
			}
			
			// Draw Center Info
			if (!this.disableCenterInfo && this._cachedInfo.centerInfo[i] && this._cachedInfo.circlePiece[i].vecLen != 0) {

				this.CONTEXT.globalAlpha = this._cachedInfo.circlePiece[i].vecLen / this.pieceOffsetAmount;
				this.CONTEXT.drawImage(
					this._buffer.centerInfo.canvas,
					this._cachedInfo.centerInfo[i].x,
					this._cachedInfo.centerInfo[i].y,
					this._cachedInfo.centerInfo[i].w,
					this._cachedInfo.centerInfo[i].h,
					this._circlePosX + this._circlePosOffsetX * (this._cachedInfo.circlePiece[i].radPercent < Math.PI ? 1 : -1) - this._cachedInfo.centerInfo[i].w * 0.5,
					this._circlePosY + this._circlePosOffsetY * (this._cachedInfo.circlePiece[i].radPercent < Math.PI ? 1 : -1) - this._cachedInfo.centerInfo[i].h * 0.5,
					this._cachedInfo.centerInfo[i].w,
					this._cachedInfo.centerInfo[i].h
				);
			}

			// Draw Percent Numbers
			if (!this.disablePercentNums && this._cachedInfo.percentNum[i]) {

				currVecX = Math.cos((this._cachedInfo.circlePiece[i].radOffset + this._cachedInfo.circlePiece[i].radPercent * 0.5) * this._circleCompletion - this.QUART_RAD);
				currVecY = Math.sin((this._cachedInfo.circlePiece[i].radOffset + this._cachedInfo.circlePiece[i].radPercent * 0.5) * this._circleCompletion - this.QUART_RAD);
				currVecLen = this.OUTER_RADIUS + this._cachedInfo.circlePiece[i].vecLen + this.percentNumOffset;
				currNumDiameter = this._cachedInfo.percentNum[i].w - this.BUFFER_PADDING;
				currArcLength = this._cachedInfo.circlePiece[i].radPercent * (this.OUTER_RADIUS + this.percentNumOffset);

				if (currNumDiameter >= currArcLength) {
					if (this.percentNumOffset >= 0) {
						this.CONTEXT.globalAlpha = 1 - (this.pieceOffsetAmount - this._cachedInfo.circlePiece[i].vecLen) / this.pieceOffsetAmount;

					} else {
						this.CONTEXT.globalAlpha = 0;
					}

				} else if (this._dataSet[i].votes == this._totalVotes) {
					this.CONTEXT.globalAlpha = ((this.pieceOffsetAmount - this._cachedInfo.circlePiece[i].vecLen) / this.pieceOffsetAmount) * this._circleCompletion;

				} else {
					this.CONTEXT.globalAlpha = this._circleCompletion;
				}

				if (this.CONTEXT.globalAlpha != 0) {
					
					this.CONTEXT.drawImage(
						this._buffer.percentNum.canvas,
						this._cachedInfo.percentNum[i].x,
						this._cachedInfo.percentNum[i].y,
						this._cachedInfo.percentNum[i].w,
						this._cachedInfo.percentNum[i].h,
						relCirclePosX + (this._dataSet[i].votes == this._totalVotes ? 0 : currVecX * currVecLen) - this._cachedInfo.percentNum[i].w * 0.5,
						relCirclePosY + (this._dataSet[i].votes == this._totalVotes ? 0 : currVecY * currVecLen) - this._cachedInfo.percentNum[i].h * 0.5,
						this._cachedInfo.percentNum[i].w,
						this._cachedInfo.percentNum[i].h
					);
				}
			}

			// Draw Vote List
			this.CONTEXT.globalAlpha = this._cachedInfo.voteListItem[i].alpha * this._circleCompletion;
			this.CONTEXT.drawImage(
				this._buffer.voteListItem.canvas,
				this._cachedInfo.voteListItem[i].x,
				this._cachedInfo.voteListItem[i].y,
				this._cachedInfo.voteListItem[i].w,
				this._cachedInfo.voteListItem[i].h,
				Math.round((this._width - this._cachedInfo.voteListItem[i].w) * 0.5),
				Math.round(this._totalCircleDiameter + this.voteListOffset + (this._cachedInfo.voteListItem[i].h - this.BUFFER_PADDING) * i - this.BUFFER_PADDING * 0.5),
				this._cachedInfo.voteListItem[i].w,
				this._cachedInfo.voteListItem[i].h
			);

			// Reset global alpha for next draw cycle
			this.CONTEXT.globalAlpha = 1;
		}
	}
}

// Strict Yes or No meter chart, only the first two entries are taken into account.
class BoolChart extends Charter {

	constructor(p_canvasId, p_data, p_colorScheme, p_barHeight, p_sort = "NONE") {

		super(p_canvasId, p_data, p_colorScheme, p_sort);

		// Define constants
		this.BAR_HEIGHT = p_barHeight;
		
		// Define private variables

		// Public settings

	}

	startChart(p_delay = 0) {

		super.startChart(p_delay);
		// Implement functionality.
	}

	_setDimensions() {
		// Implement functionality.
	}

	// Cache and draw methods go here.

	// Hitbox methods go here.

	_animate() {
		// Implement functionality.
	}

	_renderFrame() {
		
		super._renderFrame();
		// Implement functionality.
	}
}

// Have fun if you have the time.
class PizzaChart extends Charter {

	constructor(p_canvasId, p_data, p_colorScheme, p_diameter = NaN, p_extraCheese = false, p_sort = "NONE") {

		super(p_canvasId, p_data, p_colorScheme, p_sort);

		// Define constants
		
		// Define private variables

		// Public settings

	}

	startChart(p_delay = 0) {

		super.startChart(p_delay);
		// Implement functionality.
	}

	_setDimensions() {
		// Implement functionality.
	}

	// Cache and draw methods go here.

	// Hitbox methods go here.

	_animate() {
		// Implement functionality.
	}

	_renderFrame() {

		super._renderFrame();
		// Implement functionality.
	}
}
