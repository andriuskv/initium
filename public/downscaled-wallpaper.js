const wallpaper = JSON.parse(localStorage.getItem("downscaled-wallpaper"));

if (wallpaper) {
  const { dataURL, x = 50, y = 50 } = wallpaper;

  document.body.insertAdjacentHTML("beforeend", `
    <div id="downscaled-wallpaper">
      <div class="downscaled-wallpaper-image" style="background-position: ${x}% ${y}%; background-image: url(${dataURL})"></div>
    </div>
  `);
}
