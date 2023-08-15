
let monoCanvas = null;

const App = {
    data() {
        return {
            file: null,
            fileReader: new FileReader(),
            baseAverageColor: 90,
            baseAverageColorPrev: 90,
            baseAverageColorMin: 0,
            baseAverageColorMax: 255,
            baseColorDistance: 50,
            baseColorDistancePrev: 50,
            baseColorDistanceMin: 0,
            baseColorDistanceMax: 200,
            needOutline: true,
            imageWidthOri: 0,
            imageHeightOri: 100,
            imageWidth: 100,
            imageWidthMin: 100,
            imageWidthMax: 1280,
            imageSizeRate: 1,
        }
    },
    mounted() {
        monoCanvas = new MonochromeCanvas(this.$refs.canvas);
        monoCanvas.monochrome("野獣先輩.png", this.baseAverageColor, this.needOutline, this.baseColorDistance);
    },
    watch: {
        baseAverageColor(newVal) {
            if (newVal === "") {
                return;
            }
            this.baseAverageColorPrev = this.baseAverageColor;
        },
        baseColorDistance(newVal) {
            if (newVal === "") {
                return;
            }
            this.baseColorDistancePrev = this.baseColorDistance;
        }
    },
    methods: {
        onChangeInputFile(e) {
            this.file = e.target.files[0];

            const img = new Image();

            img.onload = () => {
                if (img.width < this.imageWidthMin) {
                    alert("画像の幅は100px以上必要です");
                    this.$refs.inputFile.value = "";
                    this.file = null;
                    this.imageWidth = this.imageWidthMin;
                    this.imageSizeRate = 1;
                }
                else {
                    this.imageWidth = this.imageWidthOri = img.width;
                    this.imageHeightOri = img.height;
                }
                
                URL.revokeObjectURL(img.src);
            };
            img.onerror = () => {
                URL.revokeObjectURL(img.src);
            };

            img.src = URL.createObjectURL(this.file);
        },
        onBlurBaseAverageColorNumber(e) {
            if (e.target.value === "") {
                this.baseAverageColor = this.baseAverageColorPrev;
                return;
            }
            const value = Number(e.target.value);
            if (value < this.baseAverageColorMin) {
                this.baseAverageColor = this.baseAverageColorMin;
            }
            else if (value > this.baseAverageColorMax) {
                this.baseAverageColor = this.baseAverageColorMax;
            }
        },
        onBlurBaseColorDistanceNumber(e) {
            if (e.target.value === "") {
                this.baseColorDistance = this.baseColorDistancePrev;
                return;
            }
            const value = Number(e.target.value);
            if (value < this.baseColorDistanceMin) {
                this.baseColorDistance = this.baseColorDistanceMin;
            }
            else if (value > this.baseAverageColorMax) {
                this.baseColorDistance = this.baseColorDistanceMax;
            }
        },
        onBlurImageWidth(e) {
            if (e.target.value === "") {
                this.imageWidth = this.imageWidthOri; // todo
                return;
            }
            const value = Number(e.target.value);
            if (value < this.imageWidthMin) {
                this.imageWidth = this.imageWidthMin;
            }
            else if (value > this.imageWidthMax) {
                this.imageWidth = this.imageWidthMax;
            }
        },
        onBlurImageSizeRate(e) {

        },
        onClickMonochromeButton() {
            if (this.file == null || this.imageWidth === 0) {
                return;
            }
        
            this.fileReader.readAsDataURL(this.file);
        
            this.fileReader.onload = () => {
                monoCanvas.monochrome(this.fileReader.result, this.baseAverageColor, this.needOutline, this.baseColorDistance);
            }
        }
    }
};

Vue.createApp(App).mount("#app");
