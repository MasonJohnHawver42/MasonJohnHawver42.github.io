const loadScript = (FILE_URL, async = true, type = "text/javascript") => {
	return new Promise((resolve, reject) => {
		try {
			const scriptEle = document.createElement("script");
			scriptEle.type = type;
			scriptEle.async = async;
			scriptEle.src = FILE_URL;

			scriptEle.addEventListener("load", (ev) => {
				resolve({ status: true });
			});

			scriptEle.addEventListener("error", (ev) => {
				reject({
					status: false,
					message: `Failed to load the script ＄{FILE_URL}`
				});
			});

			document.body.appendChild(scriptEle);
		} catch (error) {
			reject(error);
		}
	});
};

function getScrollTop() {
  return window.pageYOffset ||
       (document.documentElement &&
          document.documentElement.scrollTop) ||
       document.body.scrollTop;
}

function getElementFontSize(context) {
	// Returns a number
	return parseFloat(
		// of the computed font-size, so in px
		getComputedStyle(
			// for the given context
			context ||
			// or the root <html> element
			document.documentElement
		).fontSize
	);
}

function convertRem(value) {
	return convertEm(value);
}

function EmtoPixel(value, context) {
	return value * getElementFontSize(context);
}

function PixeltoEm(value, context) 
{
	return value / getElementFontSize(context);
}

const projects = document.getElementById("projects");
const overflow = document.getElementById("overflow");

var proj_index = 1;
var curr_index = 1;
const max_index = 6;
const min_index = 1;

function projects_moveleft() 
{
	if (proj_index > min_index) { proj_index = (proj_index - 1) % (max_index + 1); }
	else { proj_index = max_index; }
}

function projects_moveright() 
{
	proj_index = (proj_index + 1) % (max_index + 1);
	if (proj_index == 0) { proj_index = min_index; }
}

function updatePosition() {
	curr_index += (proj_index - curr_index) * .159;
	var overflow_width = overflow.clientWidth; //getBoundingClientRect().top + getScrollTop();
	var pos = (PixeltoEm(overflow_width, overflow) / 2.0) - ((curr_index + .5) * (43 + PixeltoEm(2, projects)));
	projects.style.transform = `translate(${pos}em, 0%)`;
	window.requestAnimationFrame(updatePosition);
}

window.requestAnimationFrame(updatePosition);