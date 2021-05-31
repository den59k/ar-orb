
export function getCameraMatrix (rows, cols, angle=40){
	const f = Math.max(rows, cols)/2/(Math.tan(angle/2*Math.PI/180))

	const mtx = [
		[ f, 0, cols / 2 ],
		[ 0, f, rows / 2 ],
		[ 0, 0, 1 ]
	]

	return mtx
}