import jsfeat from 'jsfeat'
import { ic_angle } from 'libs/ar-tools/jsfeat'
import { match_pattern } from 'libs/ar-tools/bf-matcher'
import { bufferToArray } from 'libs/ar-tools/buffer'

const blurSize = 1
jsfeat.yape06.laplacian_threshold = 25;
jsfeat.yape06.min_eigen_value_threshold = 35;

const maxSourceDescriptors = 200
const maxImageDescriptors = 600
const num_train_levels = 6

const sc_inc = Math.sqrt(1.5); // magic number ;)
//RANSAC Parameters
const model_size = 10; // minimum points to estimate motion
const thresh = 0.7; // max error to classify as inlier
const eps = 0.3; // max outliers ratio
const prob = 0.98; // probability of success
const params = new jsfeat.ransac_params_t(model_size, thresh, eps, prob);
const max_iters = 1000;

const homo_kernel = new jsfeat.motion_model.homography2d();

export default class OrbProcessor {

  constructor(width, height){
    this.width = width
    this.height = height

    //JsFeat properties
    this.gray = new jsfeat.matrix_t(this.width, this.height, jsfeat.U8_t | jsfeat.C1_t);
    this.gray_smooth = new jsfeat.matrix_t(this.width, this.height, jsfeat.U8_t | jsfeat.C1_t);

    //Дескрипторы углов
    this.descriptors = new jsfeat.matrix_t(32, 500, jsfeat.U8_t | jsfeat.C1_t);

    //Массив найденных углов на изображении
    this.corners = [] 
		for(let i = 0; i < this.width * this.height; i++)
			this.corners.push(new jsfeat.keypoint_t(0,0,0,0,-1))

    //Массив совпадений, а также массив исходных и выходных точек
    this.matches = []
    this.fromPoints = []
    this.toPoints = []
    for(let i = 0; i < maxImageDescriptors; i++){
      this.fromPoints.push(null)
      this.toPoints.push(null)
      this.matches.push({ screen_idx: 0, pattern_lev: 0, pattern_idx: 0, distance: 0 })
    }

    //И еще данные для оценки RANSAC Homography
    this.mask = new jsfeat.matrix_t(maxImageDescriptors, 1, jsfeat.U8_t | jsfeat.C1_t);
		this.homo_transform = new jsfeat.matrix_t(3, 3, jsfeat.F32_t | jsfeat.C1_t);
  }

  //Метод для получения углов и дескрипторов одновременно
  getDescriptors(img, descriptors, corners, max_allowed){
		let num_corners = jsfeat.yape06.detect(img, corners, 17)
		if(num_corners > max_allowed) {
			jsfeat.math.qsort(corners, 0, num_corners-1, (a, b) => b.score<a.score );
			num_corners = max_allowed;
		}
		
		for(var i = 0; i < num_corners; i++) 
			corners[i].angle = ic_angle(img, corners[i].x, corners[i].y);

		jsfeat.orb.describe(img, corners, num_corners, descriptors)

		return num_corners
	}

  loadSourceImage(imageData){
    //У нас несколько уровней для дескрипторов исходного изображения
    this.sourceDescriptors = []
		this.sourceCorners = []

    const gray = new jsfeat.matrix_t(imageData.width, imageData.height, jsfeat.U8_t | jsfeat.C1_t)
    const gray_smooth = gray//new jsfeat.matrix_t(imageData.width, imageData.height, jsfeat.U8_t | jsfeat.C1_t)

    jsfeat.imgproc.grayscale(imageData.data, imageData.width, imageData.height, gray)
    //jsfeat.imgproc.gaussian_blur(gray, gray_smooth, 3)

		let img = gray_smooth
    let sc = 1
    //Высчитываем дескрипторы для каждого уровня
		for(let i = 0; i < num_train_levels; i++){
			const corners = []
			for(let q = 0; q < gray_smooth.cols * gray_smooth.rows; q++)
				corners.push(new jsfeat.keypoint_t(0,0,0,0,-1))
			
			const sourceDescriptors = new jsfeat.matrix_t(32, maxSourceDescriptors, jsfeat.U8_t | jsfeat.C1_t);
			const num_corners = this.getDescriptors(img, sourceDescriptors, corners, maxSourceDescriptors)

      //Нормализуем углы
			for(let q = 0; q < num_corners; ++q) {
				corners[q].x *= 1./sc;
				corners[q].y *= 1./sc;
			}

			this.sourceDescriptors[i] = sourceDescriptors
			this.sourceCorners[i] = corners
			
      //Масштабируем изображение на новый уровень
			sc /= sc_inc;
			const	new_width = (gray_smooth.cols*sc)|0
      const new_height = (gray_smooth.rows*sc)|0

			img = new jsfeat.matrix_t(imageData.width, imageData.height, jsfeat.U8_t | jsfeat.C1_t)
			jsfeat.imgproc.resample(gray_smooth, img, new_width, new_height)
		}
  }

  estimateHomography (imageData){
    jsfeat.imgproc.grayscale(imageData.data, this.width, this.height, this.gray)
		jsfeat.imgproc.gaussian_blur(this.gray, this.gray_smooth, blurSize)

    const num_corners = this.getDescriptors(this.gray_smooth, this.descriptors, this.corners, maxImageDescriptors)

    this.matches_count = match_pattern(this.descriptors, this.sourceDescriptors, this.matches)


    if(this.matches_count < model_size / (1-eps)) return null

    for(let i = 0; i < this.matches_count; i++){
      this.fromPoints[i] = this.sourceCorners[this.matches[i].pattern_lev][this.matches[i].pattern_idx]
      this.toPoints[i] = this.corners[this.matches[i].screen_idx]
    }

    //Проводим RANSAC операцию с оценкой хомографии
    const ok = jsfeat.motion_estimator.ransac(
      params, 
      homo_kernel, 
      this.fromPoints, 
      this.toPoints, 
      this.matches_count, 
      this.homo_transform,
      this.mask, 
      max_iters
    );
    
    if(!ok) return null
    
    let j = 0
    for(let i = 0; i < this.matches_count; i++)
      if(this.mask.data[i]){
        this.toPoints[j] = this.toPoints[i]
        this.fromPoints[j] = this.fromPoints[i]
        j++
      }
    this.matches_count = j

    return bufferToArray(this.homo_transform.data, 3, 3) 
  }

}