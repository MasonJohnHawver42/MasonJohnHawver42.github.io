
const colors = 
[
    "rgb(234, 249, 183)",
    "rgb(203, 240, 165)",
    "rgb(132, 225, 138)",
    "rgb(77, 191, 127)",
    "rgb(0, 155, 46)"
];

function rand_int(cieling) { return Math.floor(Math.random() * cieling); }
function randpow_int(cieling, pow) { return Math.floor(Math.pow(Math.random(), pow) * cieling); }

function github_calender(id, user_name) 
{
    const calender = document.getElementById(id);
    console.log(calender, user_name);

    for (var i = 0; i < 7; i++) 
    {
        var row = document.createElement("div");
        row.classList.add('calender-row');
    
        for (var j = 0; j < 52; j++) 
        {
            var color = colors[randpow_int(colors.length, 1.5)];
            var day = document.createElement("div");
            day.classList.add('calender-day');
            day.style.backgroundColor = color;
            row.appendChild(day)
        }
    
        calender.appendChild(row);
    }
}
