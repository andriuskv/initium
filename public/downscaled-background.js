const background = JSON.parse(localStorage.getItem("downscaled-background"));

if (background) {
  const { dataURL, x = 50, y = 50 } = background;

  document.body.insertAdjacentHTML("beforeend", `
    <div id="downscaled-background">
      <div class="downscaled-background-image" style="background-position: ${x}% ${y}%; background-image: url(${dataURL})"></div>
    </div>
  `);
}
