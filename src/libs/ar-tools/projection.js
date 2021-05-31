import jsfeat from 'jsfeat'
import { bufferToArray } from './buffer'
import { inv, multiply, transpose, hypot, divide, cross } from 'mathjs'

export function projectPoints (_axis, cameraMatrix, matrix){
	const axis = transpose(_axis)
	const _points = transpose(multiply(multiply(cameraMatrix, matrix), axis))

	const points = _points.map(arr => ({ x: arr[0]/arr[2], y: arr[1] / arr[2] }) )

	return points
}

const matrixA = new jsfeat.matrix_t(3, 3, jsfeat.F32_t | jsfeat.C1_t);
const matrixW = new jsfeat.matrix_t(3, 3, jsfeat.F32_t | jsfeat.C1_t);
const matrixU = new jsfeat.matrix_t(3, 3, jsfeat.F32_t | jsfeat.C1_t);
const matrixV = new jsfeat.matrix_t(3, 3, jsfeat.F32_t | jsfeat.C1_t);

export function decompose (_H, mtx){
	
	const H = Array.isArray(_H)? _H: bufferToArray(_H, 3, 3)
	const _mtx = inv(mtx)

	const ext = transpose(multiply(_mtx, H))

	const l = Math.sqrt(hypot(ext[0]) * hypot(ext[1]))

	const rot1 = divide(ext[0], l)					//Мы нормализуем все по первому столбцу
	const rot2 = divide(ext[1], l)
	const rot3 = cross(ext[0], ext[1])

	matrixA.data.set(rot1, 0)
	matrixA.data.set(rot2, 3)
	matrixA.data.set(rot3, 6)

	jsfeat.linalg.svd_decompose(matrixA, matrixW, matrixU, matrixV, jsfeat.SVD_V_T)
	jsfeat.matmath.multiply(matrixA, matrixU, matrixV)

	const _rotationMatrix = []
	for(let i = 0; i < 3; i++)
		_rotationMatrix.push(Array.from(matrixA.data.slice(i*3, i*3+3)))
	
	//Ну и четвертый - вектор перемещения
	_rotationMatrix.push(divide(ext[2], l))

	const rotationMatrix = transpose(_rotationMatrix)

	return rotationMatrix
}