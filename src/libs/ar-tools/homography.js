import jsfeat from 'jsfeat'
import { multiply } from 'mathjs';
import { bufferToArray } from './buffer';

const homo_kernel = new jsfeat.motion_model.homography2d();
const homo_transform = new jsfeat.matrix_t(3, 3, jsfeat.F32_t | jsfeat.C1_t);

export function calcHomography(homography, fromPoints, toPoints, count){
  console.log(count)
  if(count < 6) return null

  homo_kernel.run(fromPoints, toPoints, homo_transform, count)
  
  const T = bufferToArray(homo_transform.data, 3, 3)

  return multiply(T, homography)
}