/* ======================================================== */
/* 1. DATA MASTER CONFIGURATION (EVENTS & ARCHIVES)         */
/* ======================================================== */
/* GOOGLE SHEET EVENT INTEGRATION
   Spreadsheet harus dipublish ke web.
   Link input:
   https://docs.google.com/spreadsheets/d/e/2PACX-1vRHBPPj241wfjmAvM2H5WFBC7fnwizWrVWJO4lJ2uQgMUvzOjMp97Oi_dmbLza49zB0DjLxLOamp0OW/pubhtml

   Format Google Sheet:
   A1: key              B1: value
   A2: title            B2: DATs_Out3 The Voyager AV performance
   A3: flyerImage       B3: web-picture/Event/dats_out3.png
   A4: description      B4: AV performance By Dats x Balimotion <br><br> ...
   A5: detail1          B5: // at Nuanu Creative City, Tabanan
   A6: detail2          B6: // June 13, 2026
   A7: detail3          B7: // Rp. 50K
   A8: footerNote       B8: DAT SPACE operates in irregular frequencies.
   A9: registrationLink B9: https://tally.so/r/vGz180
   A10: ticketLink      B10: https://www.nuanu.com/events/the-voyager-dats-out3
*/

const GOOGLE_SHEET_PUBLISHED_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHBPPj241wfjmAvM2H5WFBC7fnwizWrVWJO4lJ2uQgMUvzOjMp97Oi_dmbLza49zB0DjLxLOamp0OW/pubhtml";
const GOOGLE_SHEET_CSV_URL = GOOGLE_SHEET_PUBLISHED_URL.replace("/pubhtml", "/pub?output=csv");

// Fallback jika Google Sheet gagal terbaca
let EVENT_DATA = {
    title: "COMING SOON",
    flyerImage: "dats.png",
    description: "DATSPACE.CLUB",
    details: [
        "// SOON",
        "// SOON",
        "// SOON"
    ],
    footerNote: "DAT SPACE operates in <br> irregular frequencies.",
    registrationLink: "https:datspace.club",
    ticketLink: "https:datspace.club"
};

function parseCSV(csvText) {
    const rows = [];
    let row = [];
    let value = "";
    let insideQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (char === '"' && insideQuotes && nextChar === '"') {
            value += '"';
            i++;
        } else if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === "," && !insideQuotes) {
            row.push(value.trim());
            value = "";
        } else if ((char === "\n" || char === "\r") && !insideQuotes) {
            if (value || row.length) {
                row.push(value.trim());
                rows.push(row);
                row = [];
                value = "";
            }
            if (char === "\r" && nextChar === "\n") i++;
        } else {
            value += char;
        }
    }

    if (value || row.length) {
        row.push(value.trim());
        rows.push(row);
    }

    return rows.filter(r => r.some(cell => cell !== ""));
}

function normalizeKey(key) {
    return String(key || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/_/g, "");
}

function mapSheetRowsToEventData(rows) {
    if (!rows || rows.length < 2) return null;

    const headers = rows[0].map(normalizeKey);
    const hasTitleHeader = headers.includes("title");
    const hasValueHeader = headers.includes("value");
    const hasKeyHeader = headers.includes("key") || headers.includes("field");

    let dataMap = {};

    // Format 1: key | value
    if (hasKeyHeader && hasValueHeader) {
        const keyIndex = headers.includes("key") ? headers.indexOf("key") : headers.indexOf("field");
        const valueIndex = headers.indexOf("value");

        rows.slice(1).forEach(row => {
            const key = normalizeKey(row[keyIndex]);
            const value = row[valueIndex] || "";
            if (key) dataMap[key] = value;
        });
    }

    // Format 2: title | flyerImage | description | detail1 | detail2 | detail3
    if (hasTitleHeader) {
        const dataRow = rows[1] || [];
        headers.forEach((header, index) => {
            if (header) dataMap[header] = dataRow[index] || "";
        });
    }

    if (!dataMap.title) return null;

    const details = [
        dataMap.detail1,
        dataMap.detail2,
        dataMap.detail3,
        dataMap.detail4,
        dataMap.detail5
    ].filter(Boolean);

    if (dataMap.details) {
        dataMap.details
            .split("|")
            .map(item => item.trim())
            .filter(Boolean)
            .forEach(item => details.push(item));
    }

    return {
        title: dataMap.title || EVENT_DATA.title,
        flyerImage: dataMap.flyerimage || dataMap.flyer || dataMap.image || EVENT_DATA.flyerImage,
        description: dataMap.description || EVENT_DATA.description,
        details: details.length ? details : EVENT_DATA.details,
        footerNote: dataMap.footernote || dataMap.footer || EVENT_DATA.footerNote,
        registrationLink: dataMap.registrationlink || dataMap.registerlink || dataMap.registration || EVENT_DATA.registrationLink,
        ticketLink: dataMap.ticketlink || dataMap.ticket || EVENT_DATA.ticketLink
    };
}

async function fetchEventDataFromSheet() {
    try {
        const response = await fetch(GOOGLE_SHEET_CSV_URL, { cache: "no-store" });
        if (!response.ok) throw new Error("Google Sheet CSV tidak bisa dibaca");

        const csvText = await response.text();
        const rows = parseCSV(csvText);
        const sheetEventData = mapSheetRowsToEventData(rows);

        if (sheetEventData) {
            EVENT_DATA = sheetEventData;
            console.log("EVENT_DATA loaded from Google Sheet:", EVENT_DATA);
        } else {
            console.warn("Format Google Sheet belum sesuai. Website memakai fallback EVENT_DATA.");
        }
    } catch (error) {
        console.warn("Gagal load event dari Google Sheet. Website memakai fallback EVENT_DATA.", error);
    }
}

const ARCHIVE_PROJECTS = [
    {   
        title: "I SAW IT", 
        artist: "Divabhwn", 
        link: "/internet-art/i-saw-it/", 
        desc: "Flashlight interface exploring palm monoculture visibility." 
    },

    {   
        title: "FINDING DATA", 
        artist: "DATs", 
        link: "/internet-art/finding-data/", 
        desc: "Interactive signal hunting through fragmented digital traces." 
    },

    {   
        title: "BUBBLE", 
        artist: "DATs", 
        link: "/internet-art/bubble/", 
        desc: "Interactive bubble environment exploring spatial drift and digital fragility." 
    },

    {   
        title: "AUTO CUAN APOCALYPSE", 
        artist: "Divabhwn", 
        link: "/internet-art/judol/", 
        desc: "Hyperstimulated pop-up ecosystem simulating digital gambling spam, algorithmic manipulation, and attention hijacking culture in Indonesia." 
    },

    {   
        title: "ADEP ADEP-IN", 
        artist: "Divabhwn", 
        link: "/internet-art/adep-adepin/", 
        desc: "A ceremonial land-buying simulator where legality appears instantly, a fatherly voice approves every transaction, and ownership quietly mutates into unsolicited aspiration. Click “BELI” until property becomes prophecy." 
    },

    {   
        title: "DEMOTIVATED", 
        artist: "Divabhwn", 
        link: "/internet-art/demotivated/", 
        desc: "An impossible puzzle interface where completion continuously escapes. A study of avoidance mechanics, user persistence, and quiet digital resistance." 
    },

    {   
        title: "ID-ONT-KNOW", 
        artist: "DATs", 
        link: "/internet-art/id-ont-know", 
        desc: "A generative scan-field interface where identity fragments into data structures. A study of system mapping, signal inversion, and constructed technical myth." 
    },

    {   
        title: "OMG", 
        artist: "DATs", 
        link: "/internet-art/omg/", 
        desc: "A modular self-generating system operating without central control." 
    },

    {   
        title: "REDGREENBLUE", 
        artist: "DATs", 
        link: "/internet-art/redgreenblue/", 
        desc: "A fragmented visual system where nodes, signals, and artificial connections continuously reconfigure themselves." 
    },

    {   
        title: "DNA DATA", 
        artist: "DATs", 
        link: "/internet-art/dna-data/", 
        desc: "A generative DNA structure where coordinates, color systems (RGB–CMYK), and interaction continuously reshape a living data organism." 
    },

    {   
        title: "Co-Creation Playground", 
        artist: "Sandywinata", 
        link: "https://sandywinata.co/dats_sandywinata.co.html", 
        desc: "For introverts who don't know how to start a convo" 
    },

    {   
        title: "LUU", 
        artist: "Divabhwn", 
        link: "/internet-art/luu/", 
        desc: "A loop of Bali’s waste crisis—trucks keep moving as landfills close." 
    },

    {   
        title: "IS EDITING FREE?", 
        artist: "Aga Mahesa", 
        link: "/internet-art/is-editing-free/", 
        desc: "Yeah of course editing is free.. so do it yourself." 
    },

    {   
        title: "DNS (Dots Network Selfie)", 
        artist: "Rai Gilang Atmadhi (RGA)", 
        link: "/internet-art/dns/", 
        desc: "An experiment that utilizes real-time pixel sampling to manipulate a dynamic particle system. By processing camera feed data, the system drives particle behavior based on visual input, creating a seamless bridge between physical movement and generative digital art." 
    },

    {   
        title: "DATSEQUENCER", 
        artist: "DATs", 
        link: "/internet-art/datsequencer/", 
        desc: "An experimental system that translates rhythmic structures into evolving visual text. Driven by real-time audio signals, each frequency layer reshapes typography, layout, and density—forming a continuous dialogue between sound, structure, and generative composition." 
    },
    
    {   
        title: "SQUARECLICK", 
        artist: "DATs", 
        link: "/internet-art/squareclick/", 
        desc: "An interactive primary color box that transforms a dynamic box Grid into a live sound matrix." 
    }
];

const COLLABORATION_PROJECTS = [
    { 
        title: "FUNTIME EP", 
        artist: "DATs X FUNTIME", 
        link: "/internet-art/collaboration/funtime", 
        desc: "Galaxy for FUNTIME World" 
    }
];
/* DATABASE DOKUMENTASI UNIVERSAL */
const DOCUMENTATION_ARCHIVE = {
    "dats_in1": {
        parentProgram: "DATS_IN",
        title: "DATs_In1 — Lab Session",
        date: "Coming Soon, 2026",
        location: "MEAI Studio",
        manifesto: "This session will activate the internal studioas a controlled environment for experimentation,rehearsal, and audiovisual testing.",
        media: ["dats.png"] 
    },

    "dats_out1": {
        parentProgram: "DATS_OUT",
        title: "DATs_Out1 — BYOB 140226",
        date: "February 14, 2026",
        location: "KROMA 1984 Madahuis, Denpasar",
        manifesto: "DATs_Out1 was born from the desire to step outside the safe room and ignite the city in its rawest form. <br><br>For one night, an outdoor space in Denpasar was hacked into a projection field, no stage, no hierarchy. <br><br>Everyone arrived carrying their own projector, colliding visuals, light, and ideas directly into space. The format adopted the BYOB (Bring Your Own Beamer) concept a collective exhibition practice initiated by Rafaël Rozendaal where large scale exhibitions can emerge from the courage to share tools and territory.",
        media: [
            "DATs_Out/DATs_Out1/Documentation/img1.jpg",
            "DATs_Out/DATs_Out1/Documentation/img2.jpg",
            "DATs_Out/DATs_Out1/Documentation/img3.jpg",
            "DATs_Out/DATs_Out1/Documentation/img4.jpg",
            "DATs_Out/DATs_Out1/Documentation/img5.jpg",
            "DATs_Out/DATs_Out1/Documentation/img6.jpg",
            "DATs_Out/DATs_Out1/Documentation/img7.jpg",
            "DATs_Out/DATs_Out1/Documentation/img8.jpg",
            "DATs_Out/DATs_Out1/Documentation/img9.jpg",
            "DATs_Out/DATs_Out1/Documentation/img10.jpg",
            "DATs_Out/DATs_Out1/Documentation/img11.jpg",
            "DATs_Out/DATs_Out1/Documentation/img12.jpg",
            "DATs_Out/DATs_Out1/Documentation/img13.jpg",
            "DATs_Out/DATs_Out1/Documentation/img14.jpg",
            "DATs_Out/DATs_Out1/Documentation/img15.jpg",
            "DATs_Out/DATs_Out1/Documentation/img16.jpg",
            "DATs_Out/DATs_Out1/Documentation/img17.jpg",
            "DATs_Out/DATs_Out1/Documentation/img18.jpg",
            "DATs_Out/DATs_Out1/Documentation/img19.jpg",
            "DATs_Out/DATs_Out1/Documentation/img20.jpg",
            "DATs_Out/DATs_Out1/Documentation/img21.jpg",
            "DATs_Out/DATs_Out1/Documentation/img22.jpg",
            "DATs_Out/DATs_Out1/Documentation/img23.jpg",
            "DATs_Out/DATs_Out1/Documentation/img24.jpg",
            "DATs_Out/DATs_Out1/Documentation/img25.jpg",
            "DATs_Out/DATs_Out1/Documentation/img26.jpg",
            "DATs_Out/DATs_Out1/Documentation/img27.jpg",
            "DATs_Out/DATs_Out1/Documentation/img28.jpg",
            "DATs_Out/DATs_Out1/Documentation/img29.jpg",
            "DATs_Out/DATs_Out1/Documentation/img30.jpg",
            "DATs_Out/DATs_Out1/Documentation/img31.jpg",
            "DATs_Out/DATs_Out1/Documentation/img32.jpg",
            "DATs_Out/DATs_Out1/Documentation/img33.jpg",
            "DATs_Out/DATs_Out1/Documentation/img34.jpg",
            "DATs_Out/DATs_Out1/Documentation/img35.jpg",
            "DATs_Out/DATs_Out1/Documentation/img36.jpg",
            "DATs_Out/DATs_Out1/Documentation/img37.jpg",
            "DATs_Out/DATs_Out1/Documentation/img38.jpg",
            "DATs_Out/DATs_Out1/Documentation/img39.jpg",
            "DATs_Out/DATs_Out1/Documentation/img40.jpg",
            "DATs_Out/DATs_Out1/Documentation/img41.jpg",
            "DATs_Out/DATs_Out1/Documentation/img42.jpg",
            "DATs_Out/DATs_Out1/Documentation/img43.jpg",
            "DATs_Out/DATs_Out1/Documentation/img44.jpg",
            "DATs_Out/DATs_Out1/Documentation/img45.jpg",
            "DATs_Out/DATs_Out1/Documentation/img46.jpg",
            "DATs_Out/DATs_Out1/Documentation/img47.jpg",
            "DATs_Out/DATs_Out1/Documentation/img48.jpg",
            "DATs_Out/DATs_Out1/Documentation/img49.jpg",
            "DATs_Out/DATs_Out1/Documentation/img50.jpg",
            "DATs_Out/DATs_Out1/Documentation/img51.jpg",
            "DATs_Out/DATs_Out1/Documentation/img52.jpg",
            "DATs_Out/DATs_Out1/Documentation/img53.jpg",
            "DATs_Out/DATs_Out1/Documentation/img54.jpg",
            "DATs_Out/DATs_Out1/Documentation/img55.jpg",
            "DATs_Out/DATs_Out1/Documentation/img56.jpg",
            "DATs_Out/DATs_Out1/Documentation/img57.jpg",
            "DATs_Out/DATs_Out1/Documentation/img58.jpg",
            "DATs_Out/DATs_Out1/Documentation/img59.jpg",
            "DATs_Out/DATs_Out1/Documentation/img60.jpg",
            "DATs_Out/DATs_Out1/Documentation/img61.jpg",
            "DATs_Out/DATs_Out1/Documentation/img62.jpg",
            "DATs_Out/DATs_Out1/Documentation/img63.jpg",
            "DATs_Out/DATs_Out1/Documentation/img64.jpg",
            "DATs_Out/DATs_Out1/Documentation/img65.jpg",
            "DATs_Out/DATs_Out1/Documentation/img66.jpg",
            "DATs_Out/DATs_Out1/Documentation/img67.jpg",
            "DATs_Out/DATs_Out1/Documentation/img68.jpg",
            "DATs_Out/DATs_Out1/Documentation/img69.jpg",
            "DATs_Out/DATs_Out1/Documentation/img70.jpg"
        ] 
    },

    "dats_out2": {
        parentProgram: "DATS_OUT",
        title: "DATs_Out2 — TU'TUR'ANG'RING'<br>060626",  
        date: "June 06, 2026",
        location: "KROMA 1984 Madahuis, Denpasar",
        manifesto: "Dats x Goof.house <br><br> Experiments with irregular frequency sound systems and the realization of visual data directly in physical locations.",
        media: [
            "DATs_Out/DATs_Out2/Documentation/img1.jpg",
            "DATs_Out/DATs_Out2/Documentation/img2.jpg",
            "DATs_Out/DATs_Out2/Documentation/img3.jpg",
            "DATs_Out/DATs_Out2/Documentation/img4.jpg",
            "DATs_Out/DATs_Out2/Documentation/img5.jpg",
            "DATs_Out/DATs_Out2/Documentation/img6.jpg",
            "DATs_Out/DATs_Out2/Documentation/img7.jpg",
            "DATs_Out/DATs_Out2/Documentation/img8.jpg",
            "DATs_Out/DATs_Out2/Documentation/img9.jpg",
            "DATs_Out/DATs_Out2/Documentation/img10.jpg",
            "DATs_Out/DATs_Out2/Documentation/img11.jpg",
            "DATs_Out/DATs_Out2/Documentation/img12.jpg",
            "DATs_Out/DATs_Out2/Documentation/img13.jpg",
            "DATs_Out/DATs_Out2/Documentation/img14.jpg",
            "DATs_Out/DATs_Out2/Documentation/img15.jpg",
            "DATs_Out/DATs_Out2/Documentation/img16.jpg",
            "DATs_Out/DATs_Out2/Documentation/img17.jpg",
            "DATs_Out/DATs_Out2/Documentation/img18.jpg",
            "DATs_Out/DATs_Out2/Documentation/img19.jpg",
            "DATs_Out/DATs_Out2/Documentation/img20.jpg",
            "DATs_Out/DATs_Out2/Documentation/img21.jpg",
            "DATs_Out/DATs_Out2/Documentation/img22.jpg",
            "DATs_Out/DATs_Out2/Documentation/img23.jpg",
            "DATs_Out/DATs_Out2/Documentation/img24.jpg",
            "DATs_Out/DATs_Out2/Documentation/img25.jpg",
            "DATs_Out/DATs_Out2/Documentation/img26.jpg",
            "DATs_Out/DATs_Out2/Documentation/img27.jpg"
        ],
        link: "https://datspace.club/internet-art/event/dats_out/dats_out2/"
    },

    "dats_out3": {
        parentProgram: "DATS_OUT",
        title: "DATs_Out3 — The Voyager AV performance <br>130626",  
        date: "June 13, 2026",
        location: "Nuanu Creative City, Tabanan",
        manifesto: "AV performance By Dats x Balimotion <br><br> Experiments with irregular frequency sound systems and the realization of visual data directly inside the dome.",
        media: ["DATs_Out/DATs_Out3/Documentation/img1.webp",
                "DATs_Out/DATs_Out3/Documentation/img2.webp",
                "DATs_Out/DATs_Out3/Documentation/img3.webp",
                "DATs_Out/DATs_Out3/Documentation/img4.webp",
                "DATs_Out/DATs_Out3/Documentation/img5.webp",
                "DATs_Out/DATs_Out3/Documentation/img6.webp",
                "DATs_Out/DATs_Out3/Documentation/img7.webp",
                "DATs_Out/DATs_Out3/Documentation/img8.webp",
                "DATs_Out/DATs_Out3/Documentation/img9.webp",
                "DATs_Out/DATs_Out3/Documentation/img10.webp",
                "DATs_Out/DATs_Out3/Documentation/img11.webp",
                "DATs_Out/DATs_Out3/Documentation/img12.webp",
                "DATs_Out/DATs_Out3/Documentation/img13.webp",
                "DATs_Out/DATs_Out3/Documentation/img14.webp",
                "DATs_Out/DATs_Out3/Documentation/img15.webp",
                "DATs_Out/DATs_Out3/Documentation/img16.webp",
                "DATs_Out/DATs_Out3/Documentation/img17.webp",
                "DATs_Out/DATs_Out3/Documentation/img18.webp",
                "DATs_Out/DATs_Out3/Documentation/img19.webp",
                "DATs_Out/DATs_Out3/Documentation/img20.webp",
                "DATs_Out/DATs_Out3/Documentation/img21.webp"
            ]
    },

    "dats_to001": {
        parentProgram: "DATS_TO",
        title: "DATs_To001 — Visual Talks <br>040426",
        date: "April 4, 2026",
        location: "MEAI Studio",
        manifesto: "A visual artist meeting space to share work, processes, and ideas through artist talks, work reviews, and open discussions.",
        media: [
            "DATs_To/DATs_To001/Documentation/img1.jpg",
            "DATs_To/DATs_To001/Documentation/img2.jpg",
            "DATs_To/DATs_To001/Documentation/img3.jpg",
            "DATs_To/DATs_To001/Documentation/img4.jpg",
            "DATs_To/DATs_To001/Documentation/img5.jpg",
            "DATs_To/DATs_To001/Documentation/img6.jpg",
            "DATs_To/DATs_To001/Documentation/img7.jpg",
            "DATs_To/DATs_To001/Documentation/img8.jpg"
        ]
    }
};

/* ======================================================== */
/* 2. CANVAS SETUP & CORE STATE MANAGEMENT                  */
/* ======================================================== */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let dragging = false;
let glitchFrames = 0;
let frequency = 300;
let volume = 0.05;
let currentTab = "HOME";
let showTitle = true;
let homeExpanded = false;
let currentActiveDocId = null;

const tabs = document.querySelectorAll(".tab");
const content = document.getElementById("content");
const internetArtTab = document.getElementById("internetArtTab");

tabs.forEach(tab => { 
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active")); 

        if (internetArtTab) {
            internetArtTab.classList.remove("active"); 
        }

        tab.classList.add("active"); 
        currentTab = tab.innerText; 

        showTitle = true; 
        homeExpanded = false; 
        currentActiveDocId = null;
        content.className = "content"; 

        updateContent(); 
        glitchFrames = 15; 
        triggerSound(); 
    }); 
});

if (internetArtTab) {
    internetArtTab.addEventListener("click", (e) => {
        e.preventDefault();

        tabs.forEach(t => t.classList.remove("active"));
        internetArtTab.classList.add("active");
        
        currentTab = "INTERNET-ART";
        showTitle = false;
        homeExpanded = false;
        currentActiveDocId = null;
        content.className = "content";

        updateContent();
        glitchFrames = 15;
        triggerSound();
    });
}

/* SUB ROUTER NAVIGATION FOR SPA EXTENSION */
function switchInternetArtSubTab(subTabState) {
    currentTab = subTabState;
    currentActiveDocId = null;
    showTitle = false;
    content.className = "content";

    updateContent();

    glitchFrames = 15;
    triggerSound();
}

/* ======================================================== */
/* 3. DYNAMIC CONTENT RENDERING CONTROLLER (SPA ENGINE)     */
/* ======================================================== */
function updateContent() {
    if (currentTab === "HOME") {
        homeExpanded = false;
        showTitle = true;

        content.innerHTML = `<span id="homeTrigger" class="clickable">//WHAT IS DATSPACE</span>`;

        const trigger = document.getElementById("homeTrigger");

        if (trigger) {
            trigger.onclick = () => {
                if (homeExpanded) return;

                homeExpanded = true;
                content.classList.add("fade-out");

                setTimeout(() => {
                    showTitle = false;
                    content.classList.add("home-desc");
                    content.innerHTML = `
                    DATs (Data Space) is a creative exploration space under Meai Studio, 
                    born from the need for a playground and a testing ground. 
                    At DATs, data, sound, and light are deconstructed, played with, 
                    and reassembled into works that are constantly in motion.
                    <br><br>
                    This space becomes a meeting point where visual artists, 
                    experimental audio practitioners, and audiovisual creators 
                    come together within one ecosystem.
                    <br><br>
                    The process at DATs is closely tied to experimentation, 
                    trial and error, and noise as an essential part of artistic practice.
                    <br><br>
                    Through visual mapping and audiovisual performances, 
                    DATs encourages the emergence of new visual languages 
                    while building an alternative creative ecosystem in Bali.
                    `;

                    content.classList.remove("fade-out");
                    content.classList.add("fade-in");
                }, 400);
            };
        }
    }

    if (currentTab === "INTERNET-ART") {
        showTitle = false;
        content.classList.add("content-event");

        let cardsHTML = "";

        ARCHIVE_PROJECTS.forEach(project => {
            cardsHTML += `
                <div class="card">
                    <a href="${project.link}">
                        <h2>
                            ${project.title}<br>
                            <span style="font-size:14px; opacity:0.6; display:inline-block; margin-top:5px;">by ${project.artist}</span>
                        </h2>
                        <p>${project.desc}</p>
                    </a>
                </div>
            `;
        });

        content.innerHTML = `
        <div class="container">
            <div class="title-row">
                <div class="title">INTERNET ART ARCHIVE</div>
                <div class="collaboration">
                    <span onclick="switchInternetArtSubTab('COLLABORATION')">COLLABORATION EDITION</span>
                </div>
            </div>

            <div class="description-text">
                Internet art is art that is made on and for the internet, also known as net art. 
                It encompasses various sub-genres of computer-based art including browser art and software art.
            </div>

            <div class="grid" id="projectGrid">${cardsHTML}</div>
        </div>
        `;
    }

    if (currentTab === "COLLABORATION") {
        showTitle = false;
        content.classList.add("content-event");

        let collabCardsHTML = "";

        COLLABORATION_PROJECTS.forEach(project => {
            collabCardsHTML += `
                <div class="card">
                    <a href="${project.link}">
                        <h2>
                            ${project.title}<br>
                            <span style="font-size:14px; opacity:0.6; display:inline-block; margin-top:5px;">by ${project.artist}</span>
                        </h2>
                        <p>${project.desc}</p>
                    </a>
                </div>
            `;
        });

        content.innerHTML = `
        <div class="container">
            <div class="title-row">
                <div class="title">INTERNET ART COLLABORATION ARCHIVE</div>
                <div class="sub-prog-back" onclick="switchInternetArtSubTab('INTERNET-ART')">// BACK</div>
            </div>

            <div class="description-text">
                A curated space where internet art intersects with distinct creative visions. 
                This archive documents digital experiments and co-creations alongside artists, musicians, 
                brands, and cultural tastemakers who share a sharp sense of character, identity, and exceptional aesthetic taste.
            </div>

            <div class="grid" id="collabProjectGrid">${collabCardsHTML}</div>
        </div>
        `;
    }
        if (currentTab === "EVENT") {
        showTitle = false;
        content.classList.add("content-event");

        const detailsHTML = EVENT_DATA.details.join("<br>");

        content.innerHTML = `
        <div class="event-wrap">

            <div class="event-left">
                <img class="event-flyer" src="${EVENT_DATA.flyerImage}" alt="Event Flyer">

                <div class="event-description">
                    ${EVENT_DATA.description}
                </div>
            </div>

            <div class="event-info">
                <div class="event-title">${EVENT_DATA.title}</div>
                ${detailsHTML}
                <br><br>
                ${EVENT_DATA.footerNote}

                <div style="margin-top:30px;">
                    <a href="${EVENT_DATA.ticketLink}" target="_blank" class="clickable" style="font-weight:bold;">
                        // TICKET HERE
                    </a>
                    <br>
                    <a href="${EVENT_DATA.registrationLink}" target="_blank" class="clickable" style="font-weight:bold;">
                        // REGISTER HERE
                    </a>
                </div>
            </div>
        </div>
        `;
    }

    if (currentTab === "LOCATION") {
        showTitle = true;

        content.innerHTML = `
        <a href="https://maps.app.goo.gl/e7eK7yZ6L4t8fkuk7" target="_blank">
        Jalan Gatsu Timur No.88X, Denpasar, Bali, Indonesia
        </a>
        `;
    }

    if (currentTab === "PROGRAM") {
        showTitle = true;

        content.innerHTML = `
            <div class="program-menu">
                <span class="program-item" onclick="switchSubProgram('DATS_IN')">// DATs_In</span>
                <span class="program-item" onclick="switchSubProgram('DATS_OUT')">// DATs_Out</span>
                <span class="program-item" onclick="switchSubProgram('DATS_TO')">// DATs_To</span>
            </div>
        `;
    }

    if (currentTab === "DATS_IN") {
        showTitle = false;
        content.classList.add("content-event");

        content.innerHTML = `
            <div class="sub-prog-wrap">
                <div class="sub-prog-back" onclick="returnToProgram()">// BACK</div>

                <div class="sub-prog-hero">
                    <h1 class="sub-prog-title">DATs_In</h1>
                    <div class="sub-prog-subtitle">INTERNAL TRANSMISSION PROTOCOL</div>

                    <div class="sub-prog-manifesto">
                        DATs_In is the internal program hosted inside MEAI Studio.
                        <br><br>
                        It operates as a controlled laboratory for experimentation,
                        rehearsal, research, workshops, and intimate showings.Within this enclosed space, audiovisual systems are tested,
                        ideas are refined, and practices are developed
                        before expanding outward.
                        <br><br>
                        DATs_In is the incubation zone.
                    </div>
                </div>

                <div class="sub-prog-events">
                    <h2>Sessions</h2>
                    <div class="sub-prog-list">
                        <span class="sub-prog-link" onclick="viewDocumentation('dats_in1')">DATs_In1 — Lab Session</span>
                    </div>
                </div>
            </div>
        `;
    }

    if (currentTab === "DATS_OUT") {
        showTitle = false;
        content.classList.add("content-event");

        content.innerHTML = `
            <div class="sub-prog-wrap">
                <div class="sub-prog-back" onclick="returnToProgram()">// BACK</div>

                <div class="sub-prog-hero">
                    <h1 class="sub-prog-title">DATs_Out</h1>
                    <div class="sub-prog-subtitle">FIELD ACTIVATION PROTOCOL</div>

                    <div class="sub-prog-manifesto">
                        DATs_Out expands beyond the studio walls.
                        <br><br>
                        It activates public space, outdoor environments,
                        and unexpected locations through projection,
                        light systems, and audiovisual experiments.
                        <br><br>
                        DATs_Out is the showcase zone.
                    </div>
                </div>

                <div class="sub-prog-events">
                    <h2>Activations</h2>

                    <div class="sub-prog-list">
                        <span class="sub-prog-link" onclick="viewDocumentation('dats_out1')">DATs_Out1 — BYOB 140226</span>
                        <span class="sub-prog-link" onclick="viewDocumentation('dats_out2')">DATs_Out2 — TU'TUR'ANG'RING' 060626</span>
                        <span class="sub-prog-link" onclick="viewDocumentation('dats_out3')">DATs_Out3 — The Voyager 130626</span>
                    </div>
                </div>
            </div>
        `;
    }

    if (currentTab === "DATS_TO") {
        showTitle = false;
        content.classList.add("content-event");

        content.innerHTML = `
            <div class="sub-prog-wrap">
                <div class="sub-prog-back" onclick="returnToProgram()">// BACK</div>

                <div class="sub-prog-hero">
                    <h1 class="sub-prog-title">DATs_To</h1>
                    <div class="sub-prog-subtitle">SOURCE TRANSMISSION PROTOCOL</div>

                    <div class="sub-prog-manifesto">
                        DATs_To is the discussion program hosted inside MEAI Studio.
                        <br><br>
                        It operates as a controlled laboratory for experimentation,
                        research, workshops, and intimate discussion.
                        <br><br>
                        Within this enclosed space, visual talks,
                        ideas are refined, and practices are developed
                        together.
                        <br><br>
                        DATs_To is the discussion zone.
                    </div>
                </div>

                <div class="sub-prog-events">
                    <h2>Activations</h2>

                    <div class="sub-prog-list">
                        <span class="sub-prog-link" onclick="viewDocumentation('dats_to001')">DATs_To001 — Visual Talks</span>
                    </div>
                </div>
            </div>
        `;
    }

    if (currentTab === "CONTACT") {
        showTitle = true;

        content.innerHTML = `
        <div style="text-align:center; line-height:1.8;">
            <div><a href="mailto:info@datspace.club">info@datspace.club</a></div>
            <div style="margin-top:10px;"><a href="https://instagram.com/_____dats" target="_blank">ig: @_____dats</a></div>
        </div>
        `;
    }

    if (currentActiveDocId && DOCUMENTATION_ARCHIVE[currentActiveDocId]) {
        renderDocumentationPage(currentActiveDocId);
    }
}

/* ======================================================== */
/* 4. SUB-ROUTING & UNIVERSAL DOCS CONTROLLERS              */
/* ======================================================== */
function switchSubProgram(subState) {
    currentTab = subState;
    currentActiveDocId = null;
    showTitle = false;
    content.className = "content";

    updateContent();

    glitchFrames = 15;
    triggerSound();
}

function returnToProgram() {
    currentTab = "PROGRAM";
    currentActiveDocId = null;
    showTitle = true;
    content.className = "content";

    updateContent();

    glitchFrames = 10;
    triggerSound();
}

function viewDocumentation(docId) {
    currentActiveDocId = docId;
    showTitle = false;
    content.className = "content";

    updateContent();

    glitchFrames = 15;
    triggerSound();
}

function returnToSubProgram(parentProgramState) {
    currentActiveDocId = null;
    currentTab = parentProgramState;
    content.className = "content";

    updateContent();

    glitchFrames = 10;
    triggerSound();
}

function renderDocumentationPage(id) {
    const docData = DOCUMENTATION_ARCHIVE[id];

    content.classList.add("content-event");

    let galleryHTML = "";

    docData.media.forEach(src => {
        galleryHTML += `
            <div class="doc-media-box">
                <img src="${src}" class="doc-media" alt="Documentation" onclick="openLightbox('${src}')">
            </div>
        `;
    });

    content.innerHTML = `
        <div class="sub-prog-wrap">
            <div class="sub-prog-back" onclick="returnToSubProgram('${docData.parentProgram}')">// BACK</div>
            
            <div class="doc-header">
                <h1 class="sub-prog-title">${docData.title}</h1>
                <div class="doc-meta">// TIME: ${docData.date} | LOCATION: ${docData.location}</div>
            </div>

            <div class="sub-prog-manifesto">
                ${docData.manifesto}
            </div>

            <div class="doc-gallery">
                ${galleryHTML}
            </div>
        </div>
    `;
}

function openLightbox(imgSrc) {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");

    if (!lightbox || !lightboxImg) return;

    lightboxImg.src = imgSrc;
    lightbox.style.display = "flex";

    setTimeout(() => {
        lightbox.style.opacity = "1";
    }, 10);
}

function closeLightbox() {
    const lightbox = document.getElementById("lightbox");

    if (!lightbox) return;

    lightbox.style.opacity = "0";

    setTimeout(() => {
        lightbox.style.display = "none";
    }, 300);
}

document.addEventListener("DOMContentLoaded", async () => {
    await fetchEventDataFromSheet();
    updateContent();
});

/* ======================================================== */
/* 5. GENERATIVE CANVAS DRAW ENGINE                         */
/* ======================================================== */
function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const checkTab = currentTab;
    const isSpecialTab = ["EVENT", "INTERNET-ART", "COLLABORATION", "DATS_IN", "DATS_OUT", "DATS_TO"].includes(checkTab);

    if (!isSpecialTab && !currentActiveDocId && showTitle) {
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = Math.min(window.innerWidth / 6, 180) + "px Monospace";
        ctx.fillText("DATs", window.innerWidth / 2, window.innerHeight / 2);
    }

    if (dragging) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;

        for (let r = 50; r < Math.min(window.innerWidth, window.innerHeight) / 1.2; r += 40) {
            let offset = Math.sin(Date.now() * 0.002 + r * 0.05) * 20;

            ctx.beginPath();
            ctx.arc(window.innerWidth / 2 + offset, window.innerHeight / 2, r, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    if (glitchFrames > 0) {
        for (let i = 0; i < 120; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? "white" : "black";

            ctx.fillRect(
                Math.random() * window.innerWidth,
                Math.random() * window.innerHeight,
                Math.random() * 400,
                Math.random() * 80
            );
        }

        glitchFrames--;
    }

    requestAnimationFrame(draw);
}

draw();

/* ======================================================== */
/* 6. WEBAUDIO SYNTHESIZER ENGINE                           */
/* ======================================================== */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let mainOsc = null;
let mainGain = null;

function triggerSound() {
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = "square"; 
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

function startContinuousAudio() {
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    mainOsc = audioCtx.createOscillator();
    mainGain = audioCtx.createGain();

    const delay = audioCtx.createDelay();
    const feedbackGain = audioCtx.createGain();

    mainOsc.type = "sine";
    mainOsc.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    mainGain.gain.setValueAtTime(volume, audioCtx.currentTime);

    delay.delayTime.value = 0.25;
    feedbackGain.gain.value = 0.3;

    mainOsc.connect(mainGain);
    mainGain.connect(delay);

    delay.connect(feedbackGain);
    feedbackGain.connect(delay);

    delay.connect(audioCtx.destination);
    mainGain.connect(audioCtx.destination);

    mainOsc.start();
}

function stopContinuousAudio() {
    if (mainOsc && mainGain) {
        mainGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        mainOsc.stop(audioCtx.currentTime + 0.06);
        mainOsc = null;
    }
}

/* ======================================================== */
/* 7. POINTER & GESTURE INTERACTION LISTENERS               */
/* ======================================================== */
canvas.style.touchAction = "none";

function updateAudioPosition(e) {
    frequency = 100 + (e.clientX / window.innerWidth) * 1200;

    let yNorm = 1 - (e.clientY / window.innerHeight);
    volume = Math.pow(yNorm, 2.2) * 0.25; 

    if (dragging && mainOsc && mainGain) {
        mainOsc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        mainGain.gain.setValueAtTime(volume, audioCtx.currentTime);

        if (Math.random() > 0.88) {
            glitchFrames = 2;
        }
    }
}

canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    glitchFrames = 12;

    updateAudioPosition(e);
    startContinuousAudio();
});

canvas.addEventListener("pointerup", () => {
    dragging = false;
    stopContinuousAudio();
});

canvas.addEventListener("pointerleave", () => {
    dragging = false;
    stopContinuousAudio();
});

canvas.addEventListener("pointermove", (e) => {
    updateAudioPosition(e);
});

/* ======================================================== */
/* 8. MOBILE ZOOM LOCK PROTECTION                           */
/* ======================================================== */
document.addEventListener("touchstart", (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

let lastTouchEnd = 0;

document.addEventListener("touchend", (e) => {
    const now = Date.now();

    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }

    lastTouchEnd = now;
}, { passive: false });
