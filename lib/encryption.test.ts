import { asserts } from '../deps.ts'
import { binaryToString, stringToBinary } from './binary.ts'
import {
	decryptAsymmetrically,
	decryptSymmetrically,
	encryptAsymmetrically,
	encryptSymmetrically,
	generateEncryptionKeyPair,
	generateKey,
	generateSigningKeyPair,
	hashPassword,
	sign,
	verify,
} from './encryption.ts'

Deno.test({
	name: '[encryption] should encrypt and decrypt',
	async fn() {
		const text = `Hello, I am some text!`
		const key = await generateKey()
		const encrypted = await encryptSymmetrically(key, stringToBinary(text))
		const decrypted = binaryToString(await decryptSymmetrically(key, encrypted))

		asserts.assertEquals(decrypted, text)
	},
})

Deno.test({
	name: '[encryption] should work with password hashing',
	async fn() {
		const text = `Hello, I am some text!`
		const key = await hashPassword('some password here', 'and my salt')

		const encrypted = await encryptSymmetrically(key, stringToBinary(text))
		const decrypted = binaryToString(await decryptSymmetrically(key, encrypted))

		asserts.assertEquals(decrypted, text)
	},
})

Deno.test({
	name: '[encryption] the same passwords and salts hash should be the same keys',
	async fn() {
		const password = 'some-password'
		const salt = 'some salt'
		const hash1 = await hashPassword(password, salt)
		const hash2 = await hashPassword(password, salt)

		asserts.assertEquals(hash1, hash2)
	},
})

Deno.test({
	name: '[encryption] emojis should work',
	async fn() {
		const text =
			`Lots of emojis in here: 🌍 📦 🚇 ⬇️ 🌽 🔳 🕡 📅 💱 🐦 🛎 🔛 🌠 🐚 🤑 🏳 🗃 👄 🎆 ♈️ ⛺️ 🍐 🔃 ☂ 📋 🏀 💶 👟 🏍 ❇️ 📻 🌚 🚧 🕣 👘 🚏 ☦ 💞 👃 🏕 🕌 📑 🙏 🚯 📪 🏗 ✖️ 🌯 🕯 🙍 📝 😡 🏟 🔧 🔚 🤘 🐮 🛁 👙 🚌 💚 🐫 🚽 📟 🚬 🏇 📏 🔅 🏖 ☠ 🐣 🍙 😬 💲 🔸 🎦 🈁 🚶 Ⓜ️ 📼 🐛 🚎 🚴 💛 🔖 ✔️ 💒 😅 🔹 🕙 🗾 👋 😣 ⛏ 👎 ✏️ 🔈 🚛 🍼 🐢 ⚗ ⛱ 🍖 🐿 🔰 ⏭ ⛈ ⚔ ☸ 🌝 🍜 🎲 🅰️ 🏙 😲 🆒 🚟 ↙️ 👕 🐯 💖 🍍 💸 ⛹ 🙃 🧀 🏨 💬 ⚖ 🌞 ⛄️ 🔜 ⛓ 💭 🌿 👅 🚩 ✒️ 🐕 🔓 ☝️ ⏬ 🎻 ⚫️ 🔉 🌓 🔶 ⛸ 🏔 1️⃣ 🍒 💃 🚦 🚕 🐠 🏺 👚 💻 🍤 ⏲ 🕤 ♠️ 🎌 👊 🎊 🕉 💰 🎂 ☁️ 📫 🕷 👓 ⛽️ 🍴 🎾 🈹 🚖 ⬜️ 4️⃣ 🎢 🏎 🚆 7️⃣ ♓️ 📢 🐻 🚥 🌁 🍓 ✨ 🖼 🛋 🏡 🌵 😽 🏁 🚝 🚹 🖨 ⛅️ 🔠 🍄 😟 🌪 🎁 ✂️ 😧 ⌨ 📞 🔢 🔥 ⛪️ 🔴 👧 💝 *⃣ 🕊 🖲 📴 👖 🌈 ♏️ 2️⃣ 🐙 ☮ 💅 🍕 🎣 🐥 8️⃣ 🎉 😮 📈 🍳 ♿️ 😱 🌮 🔣 🐋 🌬 📗 🌋 ✅ 🕶 🤐 👮 🐺 🕥 🕓 🙋 🍇 📛 😋 🍲 😾 🐼 6️⃣ 🚾 😑 ⏰ 🗳 ♊️ 🍻 ©️ 🌌 🚰 🔡 🕔 📣 🉐 ✈️ ⚒ 🆑 💨 🙌 😹 📚 ⛩ 🕎 🚠 ⁉️ 🃏 ▶️ 😀 🗑 🕴 🐧 🔐 🌥 ↪️ 🏛 👨 🎍 🌰 ⬆️ 🚃 😈 🙇 😩 🎪 👠 🏐 🐸 ℹ️ 🍶 📳 🎸 ▫️ 💍 🙅 🛤 🐨 🗨 🚺 ⭐️ 🍟 ♍️ 🍈 🌾 🍘 ❎ 💾 🎐 🔗 🙀 🍊 👛 👥 👡 🔫 💣 🔘 🐳 📄 ⛴ 😎 🏥 😊 ☄ 🗓 💴 📃 👱 📒 📥 🕧 😼 💼 🐓 🍺 🐬 🐎 🔟 🗞 🏂 🌡 🚼 🍱 😜 ⏏ 📌 🎤 🛂 😍 🔞 💪 🌼 🤔 🉑 🏊 🐌 ⚙ 🌸 🚲 🤖 🐍 👾 🕋 🏫 🛅 😇 🎏 🏑 🗣 ‼️ ⏺ 🌶 💘 📡 🔩 📓 🐩 🚵 ➕ 📍 👩 ⚪️ ⛳️ 🎃 🛃 🖍 👂 🌃 🏄 🎼 🚳 ⏪ 👫 🌺 🎥 🕕 ⚓️ 🚷 🎳 ◀️ 🕦 🚙 🈴 📷 🌷 🍛 ☢ 💵 ☣ 🌻 ♣️ 🛬 ✳️ 🔌 🏈 🛌 ↕️ 📨 🚈 ⚡️ ✍ 🌜 🎠 🚄 😯 🍣 ➗ 💯 🏣 📬 💤 😿 ↔️ ➰ 🎎 🏩 🏴 🎿 🚚 😵 🌏 💡 🛡 📰 ↖️ 🍢 🌫 👀 ⏳ ❌ 🍮 💗 😝 🏪 🕸 🎗 🏷 ♉️ 🤗 🕵 🎨 🎴 🐰 ✊ 💥 🦂 🎇 🔻 🍝 🐊 👽 👼 🍋 🐷 💂 ™️ 🆙 🚫 🦀 🍹 👈 ⚜ 🐡 🤕 🔤 🔊 ◼️ 🌦 💷 🍌 😞 🤓 🔼 🚒 🎹 🍡 📿 ⚾️ 🏯 🌟 🏏 🏋 🙂 😠 🈷️ 🖖 😖 🆘 〰️ 👦 🔽 ⛲️ 🎋 🌙 🚑 🚗 🔂 🚢 🏰 👿 👝 ⛎ 🐪 😆 ♑️ 💕 🔕 ❕ 🚓 🌛 📕 🀄️ ↗️ 👸 🌔 🖱 ⏯ 😕 👜 ✌️ 🏉 🔪 📆 🍫 ☺️ 👇 🍸 🔮 🕟 🈺 🔍 🗡 ⤵️ 🌐 🛍 ☔️ 🍁 🖐 🌄 📖 👁 🍞 😴 🏘 💦 ✴️ 🐱 💩 👢 🍆 🔺 🗒 ☹ 💑 9️⃣ 🕰 📔 😦 🏠 👏 ⚠️ 🌨 🚊 🌖 😻 👭 😙 🔏 🕖 🎀 🆚 💉 😭 🌱 🕞 😰 🍵 🛫 🚉 🍑 🌹 🍿 👪 🌩 🚻 🔲 🚮 🐏 🎩 🅱️ 🏝 🈯️ 📩 🕠 ♒️ 🍯 💁 🛏 😓 🍂 🚡 🌂 📁 🐶 ❔ 🍅 🙄 ◻️ 🌊 🍗 🈂️ ❣ 😃 🚪 👔 🛐 🌴 📲 💳 👐 ⏱ 😘 🅿️ 🔑 📭 🅾️ ⏫ ⬛️ 💐 🎧 🗼 🗽 🐭 🚁 🌑 🤒 ✉️ 💋 🗿 🏢 ⏩ 📠 💽 🌀 🌲 🏤 🐒 🔔 🕜 📉 🌉 🎛 ↘️ 🚿 🕹 ⚱ 📱 🔄 🚍 🚂 🐔 3️⃣ 🚨 🕗 💈 👶 🖌 🎭 🛀 🎟 🐉 🌎 🙆 👆 🖇 ⌛️ 🔆 💙 🈲 🎙 🚸 🙎 👵 🕳 ⌚️ 💹 🛣 ⏮ 🎓 💓 🚅 🏭 🗻 🍨 🍔 🌭 ♦️ ⤴️ 🐟 🎈 🔀 🚐 🈚️ ®️ ☃ 5️⃣ ☕️ 👻 📂 👌 ⛔️ 🍧 🎷 🗂 🖕 🖊 🌘 😚 🐁 ◾️ 🙊 🎺 🐽 🏜 😶 😔 👹 👉 😸 🗺 🐖 💿 🆕 🎡 🦄 ♐️ 😂 🍥 ㊙️ 🏅 🐐 🎫 🎞 🆗 🐆 📶 😄 🍠 📧 📸 ✋ 🏒 🔇 🐗 💇 🌕 👬 💜 🎰 🎅 🚱 🏆 🐃 🍦 ♋️ ⛑ 🌗 🌅 🆖 💟 👤 🚀 😢 💧 🍉 💢 🐑 ☑️ 🍪 🎬 ↩️ 🗜 🍽 ♻️ 🌆 👞 😌 🔒 🏃 🚜 📯 👗 🛩 🚣 🖥 😒 📊 🈸 💊 👣 🎶 💀 ⬅️ 📎 🔁 🌤 🙈 💏 ㊗️ ⏹ 🕚 💎 📇 🍚 🏚 😳 🎑 🛥 🕘 🖋 📘 ⛰ 🎖 📽 🗝 ➿ 🏌 📀 ▪️ 🕛 😺 🕐 👑 🐲 🐾 ☯ 🚔 ◽️ 😁 🈵 🐹 🐄 🏞 🎮 🗯 🍾 🔦 🛰 🍬 👳 ⚛ ⚰ 🐵 🔯 🕒 🐂 🗄 🍏 😗 〽️ 🐞 📙 🆓 0️⃣ ♥️ ☀️ 💠 🔋 🌧 🎱 🌒 🏮 😪 🏸 🐜 💄 🏧 📵 🏹 ⚽️ 👴 🎚 👺 ✡ ☘ ♌️ ☎️ ♨️ 🕝 📤 🎄 ⛵️ 🌇 💫 📐 🍰 😥 🛢 📺 👷 👲 👍 🍭 ⏸ 🐈 🆔 🍷 🍎 🏓 😷 🔬 🚤 🙁 🍀 👯 🐇 🔭 😨 🎽 🎯 💮 ❄️ 🦁 ❗️ 🏬 🈶 🙉 🔙 ⭕️ ⛷ 🕢 🛄 🍩 🆎 🦃 🚭 🔷 📜 🈳 😛 😏 ✝ 💌 ☪ 🔨 🐅 😉 #️⃣ ♎️ 🛳 🕑 🎵 😐 😤 🌳 🏵 👰 💺 🚋 🔵 🔝 👒 🕍 💆 🛠`
		const key = await generateKey()

		const encrypted = await encryptSymmetrically(key, stringToBinary(text))
		const decrypted = binaryToString(await decryptSymmetrically(key, encrypted))

		asserts.assertEquals(decrypted, text)
	},
})

Deno.test({
	name: '[encryption] public/private key authentication should work',
	async fn() {
		const text = `Hello there!`
		const pair = await generateEncryptionKeyPair()

		const encrypted = await encryptAsymmetrically(pair.publicKey, stringToBinary(text))
		const decrypted = binaryToString(await decryptAsymmetrically(pair.privateKey, encrypted))

		asserts.assertEquals(decrypted, text)
	},
})

Deno.test({
	name: '[encryption] digital signatures should work',
	async fn() {
		const pair = await generateSigningKeyPair()
		const dataToSign = stringToBinary('something that we want to make sure came from somebody')

		const signature = await sign(pair.privateKey, dataToSign)
		const isValid = await verify(signature, pair.publicKey, dataToSign)

		asserts.assertEquals(isValid, true)
	},
})
