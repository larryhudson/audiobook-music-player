<script>
	import {onMount} from 'svelte';
	let silence = [];
	let songs = [];
	let queue = [];
	let songIndex = 0;
	let aPos, aDur, aPaused;
	let mPos, mDur, mPaused;
	let currentSong = "";
	let currentFilename = ""

	async function getData() {
		const res = await fetch(`data.json`);
		const json = await res.json();

		if (res.ok) {
			silence = json.silence
			songs = json.songs
			nextPause = silence.find(time => time > pauseMin)
			return json;
		} else {
			throw new Error(json);
		}
	}

	let intervalMin = 5;
	let interval = intervalMin * 60;
	let pauseMin = interval;
	let nextPause;
	let nextTimes;

	onMount(async () => {
		getData();
	})

	$: {
		if (nextPause - aPos < -0.5) {
			aPause();
		}
		if (mPos && mPos === mDur) {
			endSong();
		}
	}

	function endSong() {
		mPos = mDur
		console.log("song over!")
		mPos = undefined
		aPaused = false
		songs = [...songs.filter(song => song!==currentSong), currentSong] // put current song at end of queue
		currentSong = ""
	}

	$: queue = songs.slice(1)

	$: currentFilename = currentSong.filename;
	
	function aPause() {
		aPaused = true
		pauseMin = aPos + interval
		nextPause = silence.find(time => time > pauseMin)
		console.log(nextPause)
		currentSong = songs[0]
		// play song
	}

	function queueSong(song) {
		// put song at front of queue
		songs = [song, ...songs.filter(s => s !== song)]
	}

	function playSong(song) {
		mPaused = true
		queueSong(song)
		currentSong = songs[0]
		
		if (!aPaused) {
			aPause()
		}
		
	}

</script>

<style>
/* button.reset {
	border: none;
    margin: 0;
    padding: 0;
    width: auto;
    overflow: visible;


    color: inherit;
    font: inherit;

    line-height: normal;

    -webkit-font-smoothing: inherit;
    -moz-osx-font-smoothing: inherit;

    -webkit-appearance: none;
	text-align: inherit;
} */

audio {
	width: 100%;
}

.songs {
	max-width: 24em;
}

.songs li button {
	margin: 0;
}

.songs li button.main {
	padding: 20px 10px;
	width: 80%;
	height: 100%;
}

.songs li button.queue {
	height: 100%;
	padding: 20px 10px;
	width: 20%;
}

.songs li button:focus {
	outline: 3px solid black;
	outline-offset: -3px;
	
}

.album-artwork {
	max-width: 250px;
	height: auto;
}

</style>
<audio
	controls
	bind:currentTime={aPos}
	bind:duration={aDur}
	bind:paused={aPaused}>
	<source src="audiobook/The Power Broker_ Robert Moses and the Fall of New York (Unabridged) Part 1.mp3">
</audio>
{#if currentSong === ""}
<button on:click={e=>{aPos = nextPause - 2}}>Next silent bit in audiobook</button>
{/if}

{#if currentSong !== ""}
<audio
	controls
	bind:currentTime={mPos}
	bind:duration={mDur}
	bind:paused={mPaused}
	autoplay>
	<source src={"music/" + currentFilename}>
</audio>
<button on:click={e=>{mPos = mDur - 2}}>End of song</button><br />
<img class="album-artwork" src={currentSong.metadata.artwork} alt="" />
<p class="now-playing"><strong>Playing {currentSong.metadata.artist} - {currentSong.metadata.title}</strong></p>
{/if}
<label>How often to pause, in minutes<input type="number" bind:value={intervalMin}></label>
<ol class="songs">
{#if songs.length > 0}
<h2>Music queue</h2>
{#each songs as song}
{#if currentSong !== song}
<li><button on:click={e=>{playSong(song)}} class="main">{song.metadata.artist} - {song.metadata.title}</button><button on:click={e=>{queueSong(song)}} class="queue">Queue</button></li>
{/if}
{/each}
{/if}
</ol>
<!-- To do: read audiobook filenames from folder, combine into single 'data' json file. -->
<!--  -->