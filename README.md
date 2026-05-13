# ZotShare
ZotShare is a Web3-powered student rideshare coordination app for UCI students. It helps verified students leaving the same event find each other, share an Uber/Lyft, and use blockchain escrow to make sure everyone commits funds before the ride starts.

## Problem
Students often leave parties or events alone and pay full price for Uber/Lyft, even when other students nearby are going to the same place. If one student calls the ride, they also risk others not paying them back.

## Solution
ZotShare creates event-based ride lobbies where UCI students can join a shared ride. Each rider deposits mock USDC into a smart contract escrow. The host only receives the funds after the ride is completed and confirmed.

## Key Features
- UCI-only login using `@uci.edu` email
- Event-based ride lobbies
- Create or join a shared ride
- Embedded wallet for easy Web3 onboarding
- Mock USDC test token
- Smart contract escrow
- Refunds if the host cancels
- Receipt upload and ride confirmation
- Uber/Lyft handoff through deep links

## Why Blockchain?

Blockchain is used as a trustless lockbox.

Instead of riders paying the host directly, funds are held in escrow:
Rider deposits funds -> Smart contract holds funds -> Ride completes -> Host receives payout

Rider deposits funds
        ↓
Smart contract holds funds
        ↓
Ride happens
        ↓
Riders confirm completion
        ↓
Smart contract pays the host

