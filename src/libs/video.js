const waitCameraData = (videoElement) => new Promise((res, rej) => {
	let count = 0
	const interval = setInterval(() => {
		if(videoElement.readyState === 4){
			clearInterval(interval)
			res()
		}
		count++
		if(count === 20){
			clearInterval(interval)
			rej("Wrong Camera")
		}
	}, 50)
})

export async function getVideoStream (video) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 720, facingMode: 'environment' },
    audio: false
  })

  video.srcObject = stream
  video.play()

  await waitCameraData(video)

  return stream
}