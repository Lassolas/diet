<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';
	import { validateWorkout } from '$lib/domain/validateWorkout';
	import { nowLocalInput } from '$lib/time';
	import {
		WORKOUT_TYPES,
		WORKOUT_DURATION_STEP_MIN,
		WORKOUT_DURATION_DEFAULT_MIN,
		WORKOUT_INTENSITY_DEFAULT,
		type Workout,
		type WorkoutType
	} from '$lib/types';
	import { WORKOUT_TYPE_LABEL, formatDuration } from '$lib/ui';
	import VoiceInput from './VoiceInput.svelte';

	let {
		workout,
		autostartVoice = false
	}: { workout?: Workout; autostartVoice?: boolean } = $props();

	// UI bounds for the duration stepper; the domain validator is more permissive.
	const MIN_DURATION = 15;
	const MAX_DURATION = 240;

	// `workout` is fixed for this component's lifetime (parent remounts via {#key}).
	function seed(w?: Workout) {
		return {
			editing: w !== undefined,
			startedAt: w?.startedAt ?? nowLocalInput(),
			durationMin: w?.durationMin ?? WORKOUT_DURATION_DEFAULT_MIN,
			workoutType: (w?.workoutType ?? 'bag') as WorkoutType,
			description: w?.description ?? '',
			feeling: w?.feeling ?? '',
			intensity: w?.intensity ?? WORKOUT_INTENSITY_DEFAULT
		};
	}
	const initial = untrack(() => seed(workout));
	const editing = initial.editing;

	let startedAt = $state(initial.startedAt);
	let durationMin = $state(initial.durationMin);
	let workoutType = $state<WorkoutType>(initial.workoutType);
	let description = $state(initial.description);
	let feeling = $state(initial.feeling);
	let intensity = $state(initial.intensity);
	let saving = $state(false);
	let errorMsg = $state('');

	function stepDuration(dir: number) {
		const next = durationMin + dir * WORKOUT_DURATION_STEP_MIN;
		durationMin = Math.max(MIN_DURATION, Math.min(MAX_DURATION, next));
	}

	function onDictated(text: string) {
		const current = description.trim();
		description = current ? `${current} ${text}` : text;
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		errorMsg = '';
		const payload = {
			startedAt,
			durationMin,
			workoutType,
			description,
			feeling,
			intensity
		};
		const errors = validateWorkout(payload);
		if (errors.length) {
			errorMsg = errors.join(' ');
			return;
		}

		saving = true;
		try {
			if (editing && workout) await api.updateWorkout(workout.id, payload);
			else await api.createWorkout(payload);
			await goto('/sport', { invalidateAll: true });
		} catch (e) {
			errorMsg = (e as Error).message;
			saving = false;
		}
	}
</script>

<form onsubmit={submit}>
	<label for="startedAt">Début de la séance</label>
	<input id="startedAt" type="datetime-local" bind:value={startedAt} required />

	<label for="workoutType">Type de séance</label>
	<select id="workoutType" bind:value={workoutType}>
		{#each WORKOUT_TYPES as t (t)}
			<option value={t}>{WORKOUT_TYPE_LABEL[t]}</option>
		{/each}
	</select>

	<span class="lbl">Durée — {formatDuration(durationMin)}</span>
	<div class="duration">
		<button
			type="button"
			class="step"
			onclick={() => stepDuration(-1)}
			disabled={durationMin <= MIN_DURATION}
			aria-label="Moins 15 minutes">−</button
		>
		<span class="dur-value">{formatDuration(durationMin)}</span>
		<button
			type="button"
			class="step"
			onclick={() => stepDuration(1)}
			disabled={durationMin >= MAX_DURATION}
			aria-label="Plus 15 minutes">+</button
		>
	</div>

	<label for="description">Description</label>
	<textarea
		id="description"
		rows="3"
		bind:value={description}
		placeholder="Sac lourd, travail des combinaisons, 6 rounds…"
	></textarea>
	<VoiceInput onText={onDictated} disabled={saving} autostart={autostartVoice} />

	<label for="feeling">Ressenti (optionnel)</label>
	<textarea
		id="feeling"
		rows="2"
		bind:value={feeling}
		placeholder="fatigué, épaule douloureuse, en forme…"
	></textarea>

	<span class="lbl">Intensité — {intensity}/10</span>
	<input
		type="range"
		min="1"
		max="10"
		step="1"
		bind:value={intensity}
		aria-label="Intensité de 1 à 10"
	/>
	<div class="scale"><span>1 · facile</span><span>10 · maximale</span></div>

	{#if errorMsg}<p class="error">{errorMsg}</p>{/if}

	<div class="actions">
		<a class="btn" href="/sport">Annuler</a>
		<button type="submit" class="primary" disabled={saving}>
			{saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Ajouter'}
		</button>
	</div>
</form>

<style>
	.lbl {
		display: block;
		font-size: 0.85rem;
		color: var(--muted);
		margin: 14px 0 6px;
	}
	.duration {
		display: grid;
		grid-template-columns: 48px 1fr 48px;
		align-items: center;
		gap: 8px;
	}
	.step {
		height: 48px;
		font-size: 1.5rem;
		line-height: 1;
		padding: 0;
	}
	.dur-value {
		text-align: center;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	input[type='range'] {
		padding: 0;
		border: none;
		background: transparent;
		accent-color: var(--accent);
	}
	.scale {
		display: flex;
		justify-content: space-between;
		font-size: 0.8rem;
		color: var(--muted);
		margin-top: 4px;
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
