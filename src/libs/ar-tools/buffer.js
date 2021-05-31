export function bufferToArray(buffer, rows, cols){
	const res = []
	for(let i = 0; i < rows; i++){
		res.push([])
		for(let j = 0; j < cols; j++)
			res[i].push(buffer[i*cols+j])
	}
	return res
}

export function bufferToPoints (curr_xy, points_count=4){
	const arr = []
	for(let i = 0; i < points_count; i++)
		arr.push({ x: curr_xy[i*2], y: curr_xy[i*2+1] })

	return arr
}

export function filter (arr, mask, count){

	let j = 0
	for(let i = 0; i < count; i++)
		if(mask[i]){
			arr[j] = arr[i]
			j++
		}
	return j
}