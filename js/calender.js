function xyz(input, pop) {
    return input.replace(/[a-z]/gi, car =>
        String.fromCharCode((car.charCodeAt() - (car < 'a' ? 65 : 97) + pop + 26) % 26 + (car < 'a' ? 65 : 97))
    );
}

function abc(m, k) {
    const { d, n } = k;
    console.log(d)
    return m.map(car => String.fromCharCode(Number(car ** BigInt(d) % BigInt(n)))).join('');
}

function def() {
    const p = 61, q = 53, n = p * q, phi = (p - 1) * (q - 1), e = 17, d = (a => {for(let x=1;x<phi;x++)if((a*x)%phi===1)return x})(e);
    return { d, n };
}


function fetchGitHubContributions(userName) 
{
    const endpoint = "https://api.github.com/graphql";
    // const magic_nums = [1107n, 1542n, 1369n, 119n, 1307n, 2570n, 368n, 1859n, 1627n, 2159n, 538n, 2923n, 2185n, 2790n, 99n, 1313n, 281n, 281n, 1345n, 2235n, 2718n, 1962n, 99n, 2185n, 2271n, 28n, 690n, 2718n, 1830n, 1962n, 2170n, 487n, 3165n, 2271n, 2906n, 2160n, 641n, 1627n, 2578n, 2923n]

    const b = "1EzCO2aZDZ3K0Av17rcH6"
    const a = "ghp_H4isNEmyGScPGNf"
    const key = a + b;

    console.log("key")

    const query = `
        query($userName:String!) { 
        user(login: $userName){
            contributionsCollection {
            contributionCalendar {
                totalContributions
                weeks {
                contributionDays {
                    contributionCount
                    date
                }
                }
            }
            }
        }
        }
    `;

    const variables = {
        userName: userName
    };

    return fetch(endpoint, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            query: query,
            variables: variables
        })
    })
    .then(response => response.json())
    .catch(error => {
        console.error("Error:", error);
        // Handle errors
    });  
}

const colors = 
[
    {background: "rgb(235, 235, 235)", border: "rgb(235, 235, 235)"},
    {background: "rgb(203, 240, 165)", border: "#777"},
    {background: "rgb(132, 225, 138)", border: "#777"},
    {background: "rgb(77, 191, 127)", border: "#777"},
    {background: "rgb(0, 155, 46)", border: "#777"}
];

// function rand_int(cieling) { return Math.floor(Math.random() * cieling); }
// function randpow_int(cieling, pow) { return Math.floor(Math.pow(Math.random(), pow) * cieling); }
// Response data: 
// Object { data: {…} }
// ​
// data: Object { user: {…} }
// ​​
// user: Object { contributionsCollection: {…} }
// ​​​
// contributionsCollection: Object { contributionCalendar: {…} }
// ​​​​
// contributionCalendar: Object { totalContributions: 53, weeks: (53) […] }
// ​​​​​
// totalContributions: 53
// ​​​​​
// weeks: Array(53) [ {…}, {…}, {…}, … ]


function github_calender(id, user_name) 
{
    const calender = document.getElementById(id);

    console.log("calender")

    fetchGitHubContributions(user_name).then(response => {
        console.log("Response data:", response);
        var weeks = response.data.user.contributionsCollection.contributionCalendar.weeks;
        for (var i = 0; i < 7; i++) 
        {
            var row = document.createElement("div");
            row.classList.add('calender-row');
        
            for (var j = 0; j <= 52; j++) 
            {
                var contrib = -1;
                if (weeks.length > j && weeks[j].contributionDays.length > i ) { contrib = weeks[j].contributionDays[i].contributionCount; } 
                
                var day = document.createElement("div");
                day.classList.add('calender-day');

                if (contrib >= 0) 
                {
                    var index = Math.min(contrib, colors.length - 1)
                    day.classList.add('calender-day');
                    day.style.backgroundColor = colors[index].background;
                    day.style.borderColor = colors[index].border;
                    day.style.borderStyle = "solid"
                }

                row.appendChild(day)
            }
        
            calender.appendChild(row);
        }
    });
}
