export function initCanvas (mediaElement){

	const canvas = document.createElement('canvas')
	canvas.width = mediaElement.naturalWidth || mediaElement.videoWidth
	canvas.height = mediaElement.naturalHeight || mediaElement.videoHeight

	const ctx = canvas.getContext('2d')

	return {
		getImageData: () => {
			ctx.drawImage(mediaElement, 0, 0, canvas.width, canvas.height)
			return ctx.getImageData(0, 0, canvas.width, canvas.height)
		},
		canvas
	}
}