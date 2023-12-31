
let debugText = "";
function debug(text) {
    debugText += text + "\n";
};

let monoCanvas = null;

const MSG_NO_INPUT_DATA = 
`・変換したい文か画像を決めて生成ボタンを押してね！
・サイズが小さいとクオリティが低くなるよ！
・ちなみにYouTubeのコメントに使うとスパム判定で表示されないよ。悲しいね。`;
const MSG_ERROR = "生成に失敗したよ！ごめんね！";
const MSG_FAILURE_TEXT_MONO = "文字数が多すぎて一次加工で失敗したよ。減らしてね。";
const MSG_FAILURE_IMAGE_MONO = "画像サイズが大きすぎて一次加工で失敗したよ。減らしてね。";
const MSG_TOO_MANY_CHARA = 
`文字が多すぎて完成イメージが作れなかったよ。
でもテキストデータだけは生きてるからコピーボタンかダウンロードボタンから取得できるよ。
クオリティが低下しても完成イメージが見たい場合はサイズを小さくしてね。
ちなみに開発当時は文字をそのまま表示するスタンスだったけどスマホだと激重だったからやめたよ。`;

const App = {
    data() {
        return {
            isDebug: false,
            debugText: debugText,
            canCopyButtonClick: true,
            resultMessage: MSG_NO_INPUT_DATA,
            tukiArt: "",
            shouldDisplayMonochromeImage: false,
            mode: "text", // "text" | "image"
            text: "",
            fontFamily: "serif", // "default" | "sans" | "serif"
            tukiCount: 13,
            tukiCountPrev: 13,
            tukiCountMin: 10,
            tukiCountMax: 50,
            isBold: false,
            isTate: true,
            wasTate: true,
            isTextYokoLinePowerUp: true,
            isTextTateLinePowerUp: true,
            isImageYokoLinePowerUp: false,
            isImageTateLinePowerUp: false,
            colorCount: 3,
            file: null,
            fileReader: new FileReader(),
            baseAverageColor: 90,
            baseAverageColorPrev: 90,
            baseAverageColorMin: COLOR_B,
            baseAverageColorMax: COLOR_W,
            baseColorDistance: 50,
            baseColorDistancePrev: 50,
            baseColorDistanceMin: 0,
            baseColorDistanceMax: 200,
            needOutline: true,
            isTextColorReverse: true,
            isImageColorReverse: false,
            imageWidthOri: 0,
            imageHeightOri: 100,
            imageWidth: 100,
            imageWidthPrev: 100,
            imageWidthMin: 10,
            imageWidthMax: 5000,
            imageSizeRate: 1,
            imageSizeRatePrev: 1,
            imageSizeRateMin: 0.1,
            imageSizeRateMax: Math.floor(5000 * 10 / 10) / 10, // Math.floor(imageWidthMax * 10 / imageWidthMin) / 10
            isProcessing: false,
        }
    },
    created() {
        const params = (new URL(window.location.href)).searchParams;
        this.isDebug = params.get("isDebug") === "true";
    },
    mounted() {
        if (this.isDebug) {
            this.shouldDisplayMonochromeImage = true;
            this.text = "「わーむほーる。」";
            this.tukiCount = 13;
            // this.fontFamily = "sans";
            this.fontFamily = "serif";
            // this.fontFamily = "default";
            this.isBold = false;
            this.isTextYokoLinePowerUp = true;
            this.isTextTateLinePowerUp = true;
            this.isTate = true;
        }
    },
    watch: {
        tukiCount(newVal) {
            if (newVal === "") return;
            this.tukiCountPrev = newVal;
        },
        baseAverageColor(newVal) {
            if (newVal === "") return;
            this.baseAverageColorPrev = newVal;
        },
        baseColorDistance(newVal) {
            if (newVal === "") return;
            this.baseColorDistancePrev = newVal;
        },
        imageWidth(newVal) {
            if (newVal === "") return;
            this.imageWidthPrev = newVal;
        },
        imageSizeRate(newVal) {
            if (newVal === "") return;
            this.imageSizeRatePrev = newVal;
        },
        isProcessing(newVal) {
            if (newVal) {
                this.$refs.processing.style.display = "";
            }
            else {
                this.$refs.processing.style.display = "none";
            }
        }
    },
    computed: {
        canDisplayTukiArt() {
            return this.resultMessage === ""
                || this.resultMessage === MSG_TOO_MANY_CHARA;
        }
    },
    methods: {
        onChangeInputFile(e) {
            this.file = e.target.files[0];
            e.target.value = "";

            const img = new Image();

            img.onload = () => {
                if (img.width < this.imageWidthMin || img.width > this.imageWidthMax) {
                    alert(`画像の幅は${this.imageWidthMin}px以上${this.imageWidthMax}px以下の必要があります`);
                    this.$refs.inputFile.value = "";
                    this.file = null;
                    this.imageWidth = this.imageWidthMin;
                }
                else {
                    this.imageWidth = this.imageWidthOri = img.width;
                    this.imageHeightOri = img.height;
                    this.imageSizeRateMin = Math.ceil(this.imageWidthMin * 10 / this.imageWidth) / 10;
                    this.imageSizeRateMax = Math.floor(this.imageWidthMax * 10 / this.imageWidth) / 10;
                }
                this.imageSizeRate = 1;
                
                URL.revokeObjectURL(img.src);
            };
            img.onerror = () => {
                URL.revokeObjectURL(img.src);
            };

            img.src = URL.createObjectURL(this.file);
        },
        onBlurTukiCount(e) {
            if (e.target.value === "") {
                this.tukiCount = this.tukiCountPrev;
                return;
            }
            this.tukiCount = this.rangeCorrection(
                Number(e.target.value),
                this.tukiCountMin,
                this.tukiCountMax
            );
        },
        onChangeFontFamily(e) {
            if (e.target.value === "serif") {
                this.isBold = false;
                this.isTextYokoLinePowerUp = true;
                this.isTextTateLinePowerUp = true;
            }
            else {
                this.isBold = true;
                this.isTextYokoLinePowerUp = false;
                this.isTextTateLinePowerUp = false;
            }
        },
        onBlurBaseAverageColor(e) {
            if (e.target.value === "") {
                this.baseAverageColor = this.baseAverageColorPrev;
                return;
            }
            this.baseAverageColor = this.rangeCorrection(
                Number(e.target.value),
                this.baseAverageColorMin,
                this.baseAverageColorMax
            );
        },
        onBlurBaseColorDistance(e) {
            if (e.target.value === "") {
                this.baseColorDistance = this.baseColorDistancePrev;
                return;
            }
            this.baseColorDistance = this.rangeCorrection(
                Number(e.target.value),
                this.baseColorDistanceMin,
                this.baseColorDistanceMax
            );
        },
        onBlurImageWidth(e) {
            if (e.target.value === "") {
                this.imageWidth = this.imageWidthPrev;
                return;
            }
            this.imageWidth = this.rangeCorrection(
                Number(e.target.value),
                this.imageWidthMin,
                this.imageWidthMax
            );
            if (this.file !== null) {
                this.imageSizeRate = Math.floor(this.imageWidth * 10 / this.imageWidthOri) / 10;
            }
        },
        onBlurImageSizeRate(e) {
            if (e.target.value === "") {
                this.imageSizeRate = this.imageSizeRatePrev;
                return;
            }
            this.imageSizeRate = this.rangeCorrection(
                Number(e.target.value),
                this.imageSizeRateMin,
                this.imageSizeRateMax
            );
            if (this.file !== null) {
                this.imageWidth = Math.round(this.imageWidthOri * this.imageSizeRate);
            }
        },
        // 生成ボタン押下時
        onClickGenerateButton() {
            if (this.isProcessing) {
                return;
            }
            this.isProcessing = true;

            monoCanvas = new MonochromeCanvas();

            this.resultMessage = "";
            if (this.mode === "text") {
                if (this.text === "") {
                    this.resultMessage = MSG_NO_INPUT_DATA;
                    this.clearResult();
                    monoCanvas = null;
                    this.isProcessing = false;
                    return;
                }
                try {
                    monoCanvas.text(this.text, this.fontFamily, this.tukiCount, this.isBold, this.isTate);
                    this.tukiArt = TukiArtGenerator.createTukiArt(monoCanvas.pixels, this.isTextColorReverse, this.isTextYokoLinePowerUp, this.isTextTateLinePowerUp, 2);
                    try {
                        this.displayTukiArt();
                    }
                    catch (e) {
                        console.error(e);
                        this.resultMessage = MSG_TOO_MANY_CHARA;
                    }
                    this.wasTate = this.isTate;
                    monoCanvas = null;
                    this.isProcessing = false;
                }
                catch(e) {
                    console.error(e);
                    if (e.constructor === TooLargeCanvasError) {
                        this.resultMessage = MSG_FAILURE_TEXT_MONO;
                    }
                    else {
                        this.resultMessage = MSG_ERROR;
                    }
                    this.clearResult();
                    monoCanvas = null;
                    this.isProcessing = false;
                }
            }
            else if (this.mode === "image") {
                if (this.file == null || this.imageWidth === 0) {
                    this.resultMessage = MSG_NO_INPUT_DATA;
                    this.clearResult();
                    monoCanvas = null;
                    this.isProcessing = false;
                    return;
                }
            
                this.fileReader.readAsDataURL(this.file);
            
                this.fileReader.onload = () => {
                    monoCanvas.image(
                        this.fileReader.result,
                        this.imageWidth,
                        Math.round(this.imageHeightOri * this.imageWidth / this.imageWidthOri),
                        this.baseAverageColor,
                        this.needOutline,
                        this.baseColorDistance,
                        this.colorCount
                    ).then(() => {
                        this.tukiArt = TukiArtGenerator.createTukiArt(monoCanvas.pixels, this.isImageColorReverse, this.isImageYokoLinePowerUp, this.isImageTateLinePowerUp, this.colorCount);
                        try {
                            this.displayTukiArt();
                        }
                        catch (e) {
                            console.error(e);
                            this.resultMessage = MSG_TOO_MANY_CHARA;
                        }
                        this.wasTate = false;
                        monoCanvas = null;
                        this.isProcessing = false;
                    }).catch(e => {
                        console.error(e);
                        if (e.constructor === TooLargeCanvasError) {
                            this.resultMessage = MSG_FAILURE_IMAGE_MONO;
                        }
                        else {
                            this.resultMessage = MSG_ERROR;
                        }
                        this.clearResult();
                        monoCanvas = null;
                        this.isProcessing = false;
                    });
                };
                this.fileReader.onerror = () => {
                    this.resultMessage = MSG_ERROR;
                    this.clearResult();
                    monoCanvas = null;
                    this.isProcessing = false;
                };
            }
        },
        onClickCopyButton() {
            if (!this.canCopyButtonClick) {
                return;
            }
            this.canCopyButtonClick = false;

            navigator.clipboard.writeText(this.tukiArt);
            
            this.$refs.copyMessage.classList.add("display-copy-message");
            setTimeout(() => {
                this.$refs.copyMessage.classList.remove("display-copy-message");
                this.canCopyButtonClick = true;
            }, 2000);
        },
        onClickDownLoadTextButton() {
            if (this.tukiArt === "") {
                return;
            }
            const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
            const blob = new Blob([bom, this.tukiArt], {type:"text/plan"});
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "moon_art.txt";
            link.click();
            URL.revokeObjectURL(link.href);
        },
        onClickDownLoadImageButton() {
            if (this.tukiArt === "") {
                return;
            }
            const link = document.createElement("a");
            link.href = this.$refs.result.toDataURL("image/png");
            link.download = "moon_art.png";
            link.click();
            URL.revokeObjectURL(link.href);
        },
        rangeCorrection(val, min, max) {
            if (val < min) {
                return min;
            }
            else if (val > max) {
                return max;
            }
            return val;
        },
        clearResult() {
            this.$refs.canvas.width = 0;
            this.$refs.canvas.height = 0;
            this.$refs.result.width = 0;
            this.$refs.result.height = 0;
        },
        displayTukiArt() {
            const monoContext = this.$refs.canvas.getContext("2d", { willReadFrequently: true });
            if (this.mode === "image" && this.$refs.appWidth.clientWidth < monoCanvas.canvas.width) {
                const rate = this.$refs.appWidth.clientWidth / monoCanvas.canvas.width;
                this.$refs.canvas.width = this.$refs.appWidth.clientWidth;
                this.$refs.canvas.height = monoCanvas.canvas.height * rate;
                monoContext.drawImage(monoCanvas.canvas, 0, 0, this.$refs.canvas.width, this.$refs.canvas.height);
            }
            else {
                this.$refs.canvas.width = monoCanvas.canvas.width;
                this.$refs.canvas.height = monoCanvas.canvas.height;
                monoContext.drawImage(monoCanvas.canvas, 0, 0);
            }

            const tukiArtCanvas = TukiArtGenerator.createTukiArtCanvas(this.tukiArt);
            const resultContext = this.$refs.result.getContext("2d", { willReadFrequently: true });
            if (this.mode === "image" && this.$refs.appWidth.clientWidth < tukiArtCanvas.width) {
                const rate = this.$refs.appWidth.clientWidth / tukiArtCanvas.width;
                this.$refs.result.width = this.$refs.appWidth.clientWidth;
                this.$refs.result.height = tukiArtCanvas.height * rate;
                resultContext.drawImage(tukiArtCanvas, 0, 0, this.$refs.result.width, this.$refs.result.height);
            }
            else {
                this.$refs.result.width = tukiArtCanvas.width;
                this.$refs.result.height = tukiArtCanvas.height;
                resultContext.drawImage(tukiArtCanvas, 0, 0, this.$refs.result.width, this.$refs.result.height);
            }

            this.debugText = debugText;
        }
    }
};

Vue.createApp(App).mount("#app");
