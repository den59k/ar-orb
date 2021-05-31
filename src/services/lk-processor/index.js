import jsfeat from 'jsfeat'

const options = {
  win_size: 30,
  max_iterations: 40,
  epsilon: 0.01,
  min_eigen: 0.01
}

export default class LkProcessor {
  constructor(width, height){
    this.width = width
    this.height = height

    this.curr_img_pyr = new jsfeat.pyramid_t(10)
    this.prev_img_pyr = new jsfeat.pyramid_t(10)
    this.curr_img_pyr.allocate(this.width, this.height, jsfeat.U8_t|jsfeat.C1_t)
    this.prev_img_pyr.allocate(this.width, this.height, jsfeat.U8_t|jsfeat.C1_t)

    this.prev_xy = new Float32Array(500*2);
    this.curr_xy = new Float32Array(500*2);

    this.point_status = new Uint8Array(500)

    this.points_count = 0

    this.fromPoints = []
    this.toPoints = []
    for(let i = 0; i < 500; i++){
      this.fromPoints.push({ x: 0, y: 0 })
      this.toPoints.push({ x: 0, y: 0 })
    }
  }

  //Чтобы не выделять память под каждый новый массив точек - мы меняем местами ссылки
  swap(){
    const xy = this.curr_xy
    this.curr_xy = this.prev_xy
    this.prev_xy = xy

    const img_pyr = this.curr_img_pyr
    this.curr_img_pyr = this.prev_img_pyr
    this.prev_img_pyr = img_pyr

  }

  saveFrame(imageData){
    jsfeat.imgproc.grayscale(imageData.data, this.width, this.height, this.curr_img_pyr.data[0])
    this.curr_img_pyr.build(this.curr_img_pyr.data[0], true)
  }

  storeImageData(imageData, toPoints, points_count){
    this.saveFrame(imageData)

    for(let i = 0; i < points_count; i++){
      this.curr_xy[i*2] = toPoints[i].x
      this.curr_xy[i*2+1]= toPoints[i].y
    }
    
    this.points_count = points_count
    this.swap()
  }

  estimatePoints(imageData){
    this.saveFrame(imageData)
    
    jsfeat.optical_flow_lk.track(
      this.prev_img_pyr, this.curr_img_pyr, 
      this.prev_xy, this.curr_xy, 
      this.points_count, 
      options.win_size, 
      options.max_iterations, 
      this.point_status, 
      options.epsilon, 
      options.min_eigen
    )

    let j = 0
    for(let i = 0; i < this.points_count; i++){
      if(this.point_status[i] === 0) continue
      this.curr_xy[j*2] = this.curr_xy[i*2]
      this.curr_xy[j*2+1] = this.curr_xy[i*2+1]
      this.fromPoints[j] = { x: this.prev_xy[i*2], y: this.prev_xy[i*2+1] }
      this.toPoints[j] = { x: this.curr_xy[i*2], y: this.curr_xy[i*2+1] }
      j++
    }

    this.points_count = j
    this.swap()

    return j
  }
}