<script>
var data = {username: 'example'};
let audiobookFormResponse, musicFormResponse;

function postAudiobookFiles() {
var url = 'http://localhost:3000/upload-audiobook';
var audiobookForm = new FormData(document.forms['audiobook-form']);

return fetch(url, {
  method: 'POST', // or 'PUT'
  body: audiobookForm,
  mode: 'cors'
})
.then(res => res.json())
.then(response => {
    console.log('Success:', response)
    audiobookFormResponse = response
})
.catch(error => console.error('Error:', error));
}

function postMusicFiles() {
var url = 'http://localhost:3000/upload-music';
var musicForm = new FormData(document.forms['music-form']);

return fetch(url, {
  method: 'POST', // or 'PUT'
  body: musicForm,
  mode: 'cors'
})
.then(res => res.json())
.then(response => {
    console.log('Success:', response)
    musicFormResponse = response
})
.catch(error => console.error('Error:', error));
}



</script>

<h2>Upload audiobook</h2>

<form id="audiobook-form" enctype="multipart/form-data">
  Select files: <input type="file" name="audiobookFiles" multiple>
  <button on:click={e=>{e.preventDefault(); postAudiobookFiles()}}>Upload your files</button>
</form>

{#if audiobookFormResponse}
<p>Uploaded:</p>
<ul>
{#each audiobookFormResponse as file}
<li>{file.path}</li>
{/each}
</ul>
{/if}

<h2>Upload music</h2>

<form id="music-form" enctype="multipart/form-data">
  Select files: <input type="file" name="musicFiles" multiple>
  <button on:click={e=>{e.preventDefault(); postMusicFiles()}}>Upload your files</button>
</form>

{#if musicFormResponse}
<p>Uploaded:</p>
<ul>
{#each musicFormResponse as file}
<li>{file.path}</li>
{/each}
</ul>
{/if}