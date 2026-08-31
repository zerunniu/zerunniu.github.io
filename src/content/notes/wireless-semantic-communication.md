---
title: A Research Note on Wireless Semantic Communication with Large AI Models
date: 2026-01-31
summary: Why preserving task-relevant meaning changes how we design robust wireless AI systems.
tags: [Semantic communication, Wireless AI, Distributional robustness]
draft: false
---

Traditional wireless systems are designed around bit-level reliability. Semantic communication asks a broader question: whether the meaning or task-relevant information is preserved at the receiver.

This shift matters when large language, vision-language, and other foundation models become part of a communication pipeline. What travels across the channel may be a semantic feature, embedding, natural-language description, or intermediate representation. Some errors are harmless while others change the downstream decision entirely.

## Distribution shift is part of the channel

A model trained under one source distribution or channel condition may fail after deployment. Distributionally robust optimisation responds by learning against a family of plausible environments rather than a single empirical distribution. In wireless semantic communication, both the source and the channel can move.

## Edge deployment changes the objective

Many future AI-driven wireless applications will run on devices with limited memory, computation, bandwidth, and energy. The problem is therefore not only how to preserve semantics, but how to do so within a real systems budget.

The questions I keep returning to are practical: how should semantic distortion be measured across tasks, how can large models be adapted for edge environments, and how should communication efficiency, model efficiency, and task reliability be optimised together?
