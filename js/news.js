/* =========================================
   ST.CLARE GIRLS' CENTRE SCHOOL — news.js
   Data file: edit this to add/remove news
   ========================================= */

const newsData = [
  {
    id: 1,
    icon: 'ti-trophy',
    tag: 'Sports',
    title: ' Rugby Team Wins Regional Cup',
    excerpt: 'Our   Girls team secured a victory in the regional rugby championship finals held in Embu Stadium.',
    date: '12 Apr 2026'
  },
  {
    id: 2,
    icon: 'ti-book',
    tag: 'Academic',
    title: '2026 National Exam Results Released',
    excerpt: 'St.Clare  students post the best results in the county with a 85% pass rate and 1 B+-grade.',
    date: '20 Apr 2026'
  },
  {
    id: 3,
    icon: 'ti-palette',
    tag: 'Scouts',
    title: 'Annual Scouts Camping Competition',
    excerpt: "This year's scouts camping will take place on 22nd of May.",
    date: '10 Apr 2026'
  },
  {
    id: 4,
    icon: 'ti-building-community',
    tag: 'Community',
    title: 'Nature Walk',
    excerpt: 'Students and staff participate effectively in nature walk and hiking thereby exploring various physical features around the region.',
    date: '5 Apr 2026'
  },
  {
    id: 5,
    icon: 'ti-award',
    tag: 'Academic',
    title: 'Student Wins National Science Olympiad',
    excerpt: 'Grade 10 student Monicah Kawera took first place at the Nova Pioneer National Mathematics Olympiad in Tatu City,Nairobi.',
    date: '1 Apr 2026'
  },
  {
    id: 6,
    icon: 'ti-music',
    tag: 'Arts',
    title: 'Music Department Gets New Equipment',
    excerpt: 'Thanks to alumni donations, the music department has acquired 10 new instruments this term.',
    date: '25 Mar 2026'
  }
];

/* ----- Render news cards into #newsGrid ----- */
function renderNews(data, limit = 3) {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;

  const sliced = limit ? data.slice(0, limit) : data;

  grid.innerHTML = sliced.map(item => `
    <div class="news-card">
      <div class="news-img"><i class="ti ${item.icon}"></i></div>
      <div class="news-body">
        <span class="news-tag">${item.tag}</span>
        <h4>${item.title}</h4>
        <p>${item.excerpt}</p>
        <div class="news-date">${item.date}</div>
      </div>
    </div>
  `).join('');
}

/* Home page: show 3 cards. News page: show all */
const isNewsPage = document.body.dataset.page === 'news';
renderNews(newsData, isNewsPage ? 0 : 3);
