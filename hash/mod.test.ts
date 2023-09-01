import { asserts } from '../deps.ts'
import { Md5, Sha256, Sha512 } from './mod.ts'

const inputs = [
	'Help me! I am about to be digested!!!',
	'So far so good, though, right?',
	'8905fa2d-a67b-430f-b2d8-22a8a609d023',
	'455c4a24-f76c-4ecc-9596-9b31e1727155',
	'3bee6cbd-fa07-483f-ba68-d92af3e52d07',
	'f0afc77a-26d5-41c8-bf70-beb1e4a66efe',
	'36663c05-acf0-4bcd-aa57-8598154a3d73',
	'98cbf4c0-f611-47c7-b91e-9093422be340',
	'be0f6f77-ec0e-43fd-9c6c-5dbc139669fc',
	'9f57824a-e594-4f0e-a3b5-7cd1ab39375f',
	'876775b9-0daa-4f01-9854-ca36ec07596d',
	'27b75996-92a6-4a1b-9a96-db4e8aedc6f7',
	'fdbd5f89-dc26-4981-881a-16ac5c999c22',
	'a4d1e670-7b7d-4362-ab51-a1f788032cfb',
	'ef499f44-e5f0-4c1d-898d-bc31bb11ef7d',
	'58c722bc-d0ab-4378-90f1-36685cc6572e',
	'82399271-250b-428f-8f8e-be436713e0f1',
	'fbfb708b-de1d-4444-a235-57ba13a22541',
	'b1adb533-23fe-4deb-951e-e3dc5919e9ab',
	'fd820ccd-ddac-479b-a730-afa7d507d35b',
	'a9b1f5eb-ee24-4ee7-9df3-c7e41161648e',
	'74a6d8ab-22a4-4a52-a581-82d6d4cebb79',
	'c293eaf3-df19-4355-8110-4465947876ff',
	'ba29b958-2fc2-405c-8a1a-043349edc3e2',
	'65f80a02-7a82-40c8-950a-2ad6609bc463',
	'3110d50a-781a-4012-ae7d-54c65e156eec',
	'85104c0b-9384-483f-b9c3-b9e96baeb4c9',
	'5dcd649c-b8a4-498c-8489-13b6f357577e',
	'f8c23962-8a6e-4a38-8e8f-802d576b70a3',
	'20b70554-e307-462d-9d3b-42ebb45c7890',
	'b72bb037-2c58-4683-b2a8-541f9bcd7ea5',
	'262306b8-12d0-48e0-ade9-9a79491c2ae1',
	'73ddd5dd-c158-49e1-9c26-055002d28f38',
	'1228c8d5-4986-43de-8c31-1c15e4954366',
	'c69d4efc-9356-45ec-9aee-c2055ebf2d30',
	'ac7c3d66-0c6f-4fb7-b6f9-a96e6e3c07b1',
	'fde60ce7-b327-4bd7-adee-26b73ef889ca',
	'e2d105e2-40e0-4286-b32f-9645aba3e265',
	'938d6744-1e16-45ea-8d26-3b115ecb55cb',
	'dc8977c3-6e61-4098-8fae-ab7f3bd664ec',
	'98f5dbc2-05ed-4325-ac40-f47546d3d166',
	'da548037-1911-40e0-beff-7902ef83b8d0',
	'e25a19b5-6b3c-46ef-9163-f0eb60ca3790',
	'8e283d78-039e-4f08-834b-cdd5c880fa49',
	'f7af2e70-6d56-4f50-b948-3cb9a1abbbef',
	'dc2fba07-afa1-49bb-98af-07e856c70c80',
	'0ce96b40-e2f7-4329-a400-fd2fdc6bb313',
	'180034d2-bb2f-42e9-b8f6-60017e211f77',
	'b15be563-3d19-4f35-9048-42313fd155b2',
	'660b88dd-1ca7-434e-8a3b-9877b959292d',
	'fe9aad20-e6da-48eb-af32-e0e90631e347',
	'db1215d3-b52e-4d91-b663-2d8a83c0cb4e',
	'c6b8d836-e314-4e8c-b7e1-669741c302bb',
	'2bbcfb03-48fb-4aba-bae4-9a222d80037a',
	'7de0e431-26a9-499a-bae4-ed765e77cce0',
	'f885b524-b450-449c-9799-fa34822ee93f',
	'7892c557-e7d0-42ad-86e4-cc59bfba1ab2',
	'2d3583c6-1077-4c81-afd7-b3be00bca207',
	'e9e40795-ee99-4ae5-bf87-e68928e83785',
	'8b435425-bb55-4f36-b316-18e01a5fb71f',
	'7e509fe5-10f4-4744-8e99-404bdfc40767',
	'4513a962-0a99-4bb7-bd5d-64ad1ba7f6ad',
	'47605d4f-b717-4718-b576-6e1ec25b8d64',
	'430eabe5-a18b-4d70-a1fb-cb084d9dd534',
	'25b7178e-85bc-4d41-8e59-c3099a82f8d8',
	'9d6ab51b-4491-4032-9c22-cfbda8f5d39a',
	'76aa8bf1-1442-45b6-bd85-064058f7610d',
	'cb9bdafc-188c-41aa-8f2e-d7d3bb36233f',
	'96c4f2f7-5924-4073-aae8-63b57d729be3',
	'c64f084e-c619-4ef4-b7b3-14e721102625',
	'62c8469f-f3b8-4fbd-a572-e21304806de1',
	'd51a6746-475b-436c-8f68-66cefafd64e2',
	'2abe69f2-24e7-452f-9f75-341a49e1b616',
	'7100e2b6-5cab-4df1-a847-8991904f67ad',
	'8b6ea9b9-b23c-4687-95c9-3d7177ba58d7',
	'ab82e0f8-24bd-4bb4-9670-b2f17ae79157',
	'6140f91d-dab1-4422-af7a-66bdf588d58d',
	'42e6ba5f-750a-45f7-a723-77ad7eb6d9e3',
	'69893b79-6a9b-48ca-81a7-4726c66530b9',
	'6109d3a7-f5ed-4ea9-a5fb-42ec14708595',
	'e6d85fa6-411d-4f5b-ad52-c864130316fa',
	'b44137f4-6415-472d-9cea-ef52fcaf39d7',
	'42808747-4acc-4043-b032-4c6e788187ad',
	'e82bd322-1752-4eb6-974e-4e3ce452fd1c',
	'f9f99bec-8f62-4d03-bc1c-c844e655f66a',
	'c693c5ae-76b8-46e5-a1c1-934ac43b5f13',
	'21c5a139-f508-4848-9695-241554e4feec',
	'abbb9a5a-301b-4f64-87aa-c5b871068cde',
	'643fadb0-072a-4e5d-a1c9-607a7eb116c7',
	'3227e4f5-2828-4e7b-801a-4b63eb63897c',
	'7af229ea-b90f-4736-a402-8f40b90257a0',
	'2c7edf08-88a1-4572-a861-5e7f79051847',
	'eecedf25-4d22-4e40-a481-caffedda9836',
	'b466c04b-b390-4b2e-9a74-c0f9bf35e1eb',
	'21c430b5-8ce2-43e5-b5c9-09cc86c72724',
	'6ff5beb9-6cc2-4f02-9b8f-fb9d08b62b3f',
	'f0d0db22-7141-40d7-abb7-d68edeaab3ca',
	'41a39012-2cef-4519-8f32-63fb54a2690e',
	'36d732cf-a678-458b-83ac-97af183f61fe',
	'df900960-b8c1-4e5f-8b4c-694a960f901b',
	'cf4b2a6f-f9a4-40c1-9121-bb5d1e1ddf7e',
	'8b3a9875-ddec-43cb-9a16-e852a71c1d32',
]

// There is only a 1 char difference in the 33 item
const differentInputs = inputs.map((input, index) => {
	if (index === 33) return '3' + input.slice(1)

	return input
})

Deno.test('Md5.hash does not collide on different inputs', () => {
	asserts.assertNotEquals(Md5.hash(inputs[0]), Md5.hash(inputs[1]))
})

Deno.test('Md5.hash is consistent on the same input', () => {
	asserts.assertEquals(Md5.hash(inputs[0]), Md5.hash(inputs[0]))
})

Deno.test('Md5.append does not collide on the different inputs', () => {
	const hash1 = new Md5()
	const hash2 = new Md5()

	inputs.forEach((input) => hash1.append(input))
	differentInputs.forEach((input) => hash2.append(input))

	asserts.assertNotEquals(hash1.get(), hash2.get())
})

Deno.test('Md5.append is consistent on the same inputs', () => {
	const hash1 = new Md5()
	const hash2 = new Md5()

	inputs.forEach((input) => hash1.append(input))
	inputs.forEach((input) => hash2.append(input))

	asserts.assertEquals(hash1.get(), hash2.get())
})

Deno.test('Sha256.hash does not collide on different inputs', async () => {
	asserts.assertNotEquals(await Sha256.hash(inputs[0]), await Sha256.hash(inputs[1]))
})

Deno.test('Sha256.hash is consistent on the same input', async () => {
	asserts.assertEquals(await Sha256.hash(inputs[0]), await Sha256.hash(inputs[0]))
})

Deno.test('Sha256.append does not collide on the different inputs', async () => {
	const hash1 = new Sha256()
	const hash2 = new Sha256()

	for (const input of inputs) await hash1.append(input)
	for (const input of differentInputs) await hash2.append(input)

	asserts.assertNotEquals(hash1.get(), hash2.get())
})

Deno.test('Sha256.append is consistent on the same inputs', async () => {
	const hash1 = new Sha256()
	const hash2 = new Sha256()

	for (const input of inputs) await hash1.append(input)
	for (const input of inputs) await hash2.append(input)

	asserts.assertEquals(hash1.get(), hash2.get())
})

Deno.test('Sha512.hash does not collide on different inputs', async () => {
	asserts.assertNotEquals(await Sha512.hash(inputs[0]), await Sha512.hash(inputs[1]))
})

Deno.test('Sha512.hash is consistent on the same input', async () => {
	asserts.assertEquals(await Sha512.hash(inputs[0]), await Sha512.hash(inputs[0]))
})

Deno.test('Sha512.append does not collide on the different inputs', async () => {
	const hash1 = new Sha512()
	const hash2 = new Sha512()

	for (const input of inputs) await hash1.append(input)
	for (const input of differentInputs) await hash2.append(input)

	asserts.assertNotEquals(hash1.get(), hash2.get())
})

Deno.test('Sha512.append is consistent on the same inputs', async () => {
	const hash1 = new Sha512()
	const hash2 = new Sha512()

	for (const input of inputs) await hash1.append(input)
	for (const input of inputs) await hash2.append(input)

	asserts.assertEquals(hash1.get(), hash2.get())
})
