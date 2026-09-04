<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';
	import { resizeToJpeg } from '$lib/photo';
	import { mealTypeForTime } from '$lib/domain/mealType';
	import { validateEntry } from '$lib/domain/validateEntry';
	import { nowLocalInput } from '$lib/time';
	import { MAX_PHOTOS_PER_ENTRY, type MealEntry, type MealType, type Photo } from '$lib/types';
	import MealTypePicker from './MealTypePicker.svelte';

	let { entry }: { entry?: MealEntry } = $props();

	// `entry` is fixed for this component's lifetime: the edit page remounts the
	// form via {#key entry.id}. Seed the form fields from it once.
	function seed(e?: MealEntry) {
		return {
			editing: e !== undefined,
			eatenAt: e?.eatenAt ?? nowLocalInput(),
			mealType: e?.mealType ?? mealTypeForTime(new Date()),
			description: e?.description ?? '',
			note: e?.note ?? '',
			photos: e ? [...e.photos] : []
		};
	}
	const initial = untrack(() => seed(entry));
	const editing = initial.editing;

	let eatenAt = $state(initial.eatenAt);
	let mealType = $state<MealType>(initial.mealType);
	let description = $state(initial.description);
	let note = $state(initial.note);

	let existingPhotos = $state<Photo[]>(initial.photos);
	let staged = $state<{ id: string; file: File; preview: string }[]>([]);

	let chips = $state<string[]>([]);
	let saving = $state(false);
	let busyPhoto = $state(false);
	let errorMsg = $state('');

	const photoCount = $derived(existingPhotos.length + staged.length);
	const canAddPhoto = $derived(photoCount < MAX_PHOTOS_PER_ENTRY);

	$effect(() => {
		const mt = mealType;
		api
			.frequentItems(mt)
			.then((items) => {
				if (mt === mealType) chips = items;
			})
			.catch(() => (chips = []));
	});

	async function onFiles(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const files = [...(input.files ?? [])];
		input.value = '';
		errorMsg = '';
		busyPhoto = true;
		try {
			for (const file of files) {
				if (photoCount >= MAX_PHOTOS_PER_ENTRY) break;
				const jpeg = await resizeToJpeg(file);
				if (editing && entry) {
					const photo = await api.uploadPhoto(entry.id, jpeg);
					existingPhotos = [...existingPhotos, photo];
				} else {
					const asFile = new File([jpeg], 'photo.jpg', { type: 'image/jpeg' });
					staged = [
						...staged,
						{ id: crypto.randomUUID(), file: asFile, preview: URL.createObjectURL(asFile) }
					];
				}
			}
		} catch (e) {
			errorMsg = (e as Error).message;
		} finally {
			busyPhoto = false;
		}
	}

	async function removeExisting(photo: Photo) {
		if (editing) await api.deletePhoto(photo.id).catch((e) => (errorMsg = (e as Error).message));
		existingPhotos = existingPhotos.filter((p) => p.id !== photo.id);
	}

	function removeStaged(id: string) {
		const item = staged.find((s) => s.id === id);
		if (item) URL.revokeObjectURL(item.preview);
		staged = staged.filter((s) => s.id !== id);
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		errorMsg = '';
		const errors = validateEntry({
			eatenAt,
			mealType,
			description,
			note,
			hasPhoto: photoCount > 0
		});
		if (errors.length) {
			errorMsg = errors.join(' ');
			return;
		}

		saving = true;
		try {
			const payload = { eatenAt, mealType, description, note, hasPhoto: photoCount > 0 };
			if (editing && entry) {
				await api.updateEntry(entry.id, payload);
			} else {
				const created = await api.createEntry(payload);
				for (const s of staged) await api.uploadPhoto(created.id, s.file);
			}
			await goto('/', { invalidateAll: true });
		} catch (e) {
			errorMsg = (e as Error).message;
			saving = false;
		}
	}
</script>

<form onsubmit={submit}>
	<label for="eatenAt">Quand</label>
	<input id="eatenAt" type="datetime-local" bind:value={eatenAt} required />

	<span class="lbl">Type de repas</span>
	<MealTypePicker bind:value={mealType} />

	<label for="description">Qu'as-tu mangé&nbsp;?</label>
	<textarea id="description" rows="3" bind:value={description} placeholder="2 œufs, pain complet, café noir"
	></textarea>

	{#if chips.length}
		<div class="chips">
			{#each chips as chip (chip)}
				<button type="button" class="chip" onclick={() => (description = chip)}>{chip}</button>
			{/each}
		</div>
	{/if}

	<label for="note">Note (optionnel)</label>
	<textarea id="note" rows="2" bind:value={note} placeholder="au restaurant, très faim après le sport…"
	></textarea>

	<span class="lbl">Photos ({photoCount}/{MAX_PHOTOS_PER_ENTRY})</span>
	<div class="photos">
		{#each existingPhotos as photo (photo.id)}
			<div class="thumb">
				<img src={photo.url} alt="" />
				<button type="button" class="x" onclick={() => removeExisting(photo)} aria-label="Supprimer"
					>×</button
				>
			</div>
		{/each}
		{#each staged as item (item.id)}
			<div class="thumb">
				<img src={item.preview} alt="" />
				<button type="button" class="x" onclick={() => removeStaged(item.id)} aria-label="Supprimer"
					>×</button
				>
			</div>
		{/each}
	</div>
	{#if canAddPhoto}
		<label class="btn file-btn">
			{busyPhoto ? 'Traitement…' : 'Ajouter une photo'}
			<input type="file" accept="image/*" multiple hidden onchange={onFiles} disabled={busyPhoto} />
		</label>
	{/if}

	{#if errorMsg}<p class="error">{errorMsg}</p>{/if}

	<div class="actions">
		<a class="btn" href="/">Annuler</a>
		<button type="submit" class="primary" disabled={saving || busyPhoto}>
			{saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Ajouter'}
		</button>
	</div>
</form>

<style>
	.lbl {
		display: block;
		font-size: 0.85rem;
		color: var(--muted);
		margin: 14px 0 4px;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 8px;
	}
	.chip {
		padding: 6px 10px;
		border-radius: 999px;
		font-size: 0.85rem;
	}
	.photos {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.thumb {
		position: relative;
		width: 84px;
		height: 84px;
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 8px;
	}
	.thumb .x {
		position: absolute;
		top: -8px;
		right: -8px;
		width: 24px;
		height: 24px;
		border-radius: 999px;
		padding: 0;
		line-height: 1;
		background: var(--surface);
	}
	.file-btn {
		display: inline-block;
		margin-top: 10px;
		text-align: center;
	}
	.actions {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		margin-top: 24px;
	}
	.actions .primary {
		flex: 1;
	}
	a.btn {
		text-decoration: none;
		display: inline-flex;
		align-items: center;
	}
</style>
