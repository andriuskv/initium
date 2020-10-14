const background = JSON.parse(localStorage.getItem("downscaled-background"));

if (background) {
  const backgroundElement = document.getElementById("downscaled-background");
  const { dataURL, x, y } = background;

  backgroundElement.style.backgroundImage = `url(${dataURL})`;
  backgroundElement.style.backgroundPosition = `${x}% ${y}%`;
}
