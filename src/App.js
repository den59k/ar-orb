import { useEffect, useRef } from "react";
import { getVideoStream } from "libs/video";
import ImageProcessor from 'services/image-processor'
import { drawPoints } from 'libs/custom'

function App() {

  const videoRef = useRef()
  const canvasRef = useRef()
  const sourceImage = useRef()

  useEffect(() => {

    const imageProcessor = new ImageProcessor()
    const init = async () => {
      await getVideoStream(videoRef.current)
      await imageProcessor.init(videoRef.current, sourceImage.current)
      
      canvasRef.current.width = imageProcessor.width
      canvasRef.current.height = imageProcessor.height
      const ctx = canvasRef.current.getContext('2d')

      imageProcessor.process(({imageData, matrix}) => {
        ctx.putImageData(imageData, 0, 0)

        const size = { width: sourceImage.current.naturalWidth, height: sourceImage.current.naturalHeight }
        drawPoints(ctx, matrix, imageProcessor.cameraMatrix, size)
        
        //console.log(matrix)
      })
    }
    init()

    return () => {
      imageProcessor.stop()
    }
  }, [])

  return (
    <div className="App">
      <video ref={videoRef} style={{display: "none"}}/>
      <canvas ref={canvasRef}/>
      <img ref={sourceImage} src="/patterns/main.png" alt="Изображение для трекинга"/>
    </div>
  );
}

export default App;
