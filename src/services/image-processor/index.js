import { getCameraMatrix } from "libs/ar-tools/camera"
import { initCanvas } from "libs/canvas"
import OrbProcessor from '../orb-processor'
import LkProcessor from '../lk-processor'
import { grayscaleToImageData } from "libs/ar-tools/jsfeat"
import { filter } from "libs/ar-tools/buffer"
import { calcHomography } from "libs/ar-tools/homography"

class ImageProcessor {

  stopFlag = false

  async init (video, sourceImage){
    const { getImageData, canvas } = initCanvas(video)
    
    this.width = canvas.width
    this.height = canvas.height
    this.getImageData = getImageData

    this.cameraMatrix = getCameraMatrix(this.height, this.width, 35)

    //Инициируем ORB процессор и загружаем в него изображение для трекинга
    this.orbProcessor = new OrbProcessor(this.width, this.height)
    const { getImageData: getSourceImageData } = initCanvas(sourceImage)
    this.orbProcessor.loadSourceImage(getSourceImageData())

    //А также инициируем обработчик для Lucas-Canade алгоритма
    this.lkProcessor = new LkProcessor(this.width, this.height)

    this.homographyMatrix = null
  }

  process (callback){
    const computeImage = () => {

      const imageData = this.getImageData()

      if(!this.homographyMatrix){
        this.homographyMatrix = this.orbProcessor.estimateHomography(imageData)
        
        if(this.homographyMatrix)
          this.lkProcessor.storeImageData(imageData, this.orbProcessor.toPoints, this.orbProcessor.matches_count)

        grayscaleToImageData(this.orbProcessor.gray_smooth, imageData)
      }else{

        this.lkProcessor.estimatePoints(imageData)
        const { fromPoints, toPoints, points_count } = this.lkProcessor

        this.homographyMatrix = calcHomography(this.homographyMatrix, fromPoints, toPoints, points_count)

        grayscaleToImageData(this.lkProcessor.prev_img_pyr.data[0], imageData)
      }
      
      callback({ imageData, matrix: this.homographyMatrix })

      if(!this.stopFlag) requestAnimationFrame(computeImage)
    }
    computeImage()
  }

  stop(){
    this.stopFlag = true
  }

}

export default ImageProcessor