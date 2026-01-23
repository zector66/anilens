// Fetch all AniList tags using native fetch (Node 18+)
const query = `
query {
  MediaTagCollection {
    id
    name
    description
    category
    isAdult
    isGeneralSpoiler
    isMediaSpoiler
  }
}
`;

fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: JSON.stringify({ query })
})
  .then(res => res.json())
  .then(data => {
    const tags = data.data.MediaTagCollection;
    console.log(JSON.stringify(tags, null, 2));
    console.log(`\n\nTotal tags: ${tags.length}`);
  })
  .catch(err => console.error('Error:', err));
