import { decompose, projectPoints } from 'libs/ar-tools/projection'

const colors = [ "#FF0000", "#00FF00", "#0000FF" ]

export function drawPoints (ctx, homography, cameraMatrix, { width, height }){

  if(!homography) return

  const axisPoints = [
    [ 0, 0, 0, 1 ],
		[ 50, 0, 0, 1 ],
		[ 0, 50, 0, 1 ],
		[ 0, 0, -50, 1 ],
    //А также массив точек для краёв изображения
    [0, 0, 0, 1],
    [0, height, 0, 1],
    [width, height, 0, 1],
    [width, 0, 0, 1]
  ]

  const matrix = decompose(homography, cameraMatrix)
  const points = projectPoints(axisPoints, cameraMatrix, matrix)

  ctx.lineWidth = 3
  ctx.strokeStyle = '#00FF00'
  for(let i = 4; i < 8; i++){
    ctx.beginPath()
    ctx.moveTo(points[i].x, points[i].y)
    ctx.lineTo(points[(i+1)>7? 4: (i+1)].x, points[(i+1)>7? 4: (i+1)].y)
    ctx.stroke()
  }

  ctx.lineWidth = 5
  for(let i = 1; i < 4; i++){
    ctx.strokeStyle = colors[i-1]
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    ctx.lineTo(points[i].x, points[i].y)
    ctx.stroke();
  }

}