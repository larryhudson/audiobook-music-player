const splitAudio = require("./mp3");
const fs = require("fs");
const getMP3Duration = require("get-mp3-duration");
const mm = require("music-metadata");
const util = require("util");
const path = require("path");

const readdir = util.promisify(fs.readdir)

const musicFolderPath = path.join("public", "music");

async function getSilence() {
  const duration = getMP3Duration(
    fs.readFileSync(
      "public/audiobook/The Power Broker_ Robert Moses and the Fall of New York (Unabridged) Part 1.mp3"
    )
  );

  return splitAudio(
    fs.createReadStream(
      "./public/audiobook/The Power Broker_ Robert Moses and the Fall of New York (Unabridged) Part 1.mp3"
    ),
    duration
  ).then(result => {
    return result
      .filter(item => item.isSilence && item.duration >= 3)
      .map(time => {
        let seconds = time.startTime / 1000;
        return seconds.toFixed(6);
      });
  });
}

async function parseFiles(audioFiles) {
  let albumArts = [];

  console.log(audioFiles)

  for (const audioFile of audioFiles) {
    const metadata = await mm.parseFile(
      path.join(musicFolderPath, audioFile.filename)
    );
    audioFile.metadata = {
      title: metadata.common.title,
      artist: metadata.common.artist,
      album: metadata.common.album,
      albumartist: metadata.common.albumartist,
      artwork: path.join(
        "music",
        "art",
        (
          metadata.common.albumartist +
          "-" +
          metadata.common.album
        ).toLowerCase() + ".jpg"
      )
    };
    //
    if (
      !albumArts.filter(
        artObj =>
          artObj.albumartist === metadata.common.albumartist &&
          artObj.title === metadata.common.album
      ).length
    ) {
      albumArts.push({
        albumartist: metadata.common.albumartist,
        title: metadata.common.album,
        data: metadata.common.picture[0].data
      });
    }
  }
  return { audioFiles, albumArts };
}

async function main() {
  const silence = await getSilence();

  let mp3s = fs.readdirSync(musicFolderPath)
    .filter(file => file.endsWith(".mp3"))
    .map(file => {
      return { filename: file };
    });

  let { audioFiles, albumArts } = await parseFiles(mp3s);

  albumArts.forEach(art => {
    const filename = (art.albumartist + "-" + art.title).toLowerCase() + ".jpg";
    fs.writeFile(
      path.join(musicFolderPath, "art", filename),
      art.data,
      function(err) {
        if (err) throw err;
        console.log("wrote", filename);
      }
    );
  });

  data = { silence, songs: audioFiles };

  fs.writeFile("public/data.json", JSON.stringify(data), "utf8", function(err) {
    if (err) throw err;
    console.log("wrote data.json");
  });

  return data
}

module.exports = main