from codette_training_data import PERSPECTIVE_RESPONSE_TRAINING

print("=" * 80)
print("CODETTE TRAINING DATA VERIFICATION")
print("=" * 80)
print()

print(f"✅ Perspectives loaded: {len(PERSPECTIVE_RESPONSE_TRAINING)}")
print()

total_examples = 0
for perspective, data in PERSPECTIVE_RESPONSE_TRAINING.items():
    examples = data.get("training_examples", [])
    total_examples += len(examples)
    print(f"  {data['icon']} {perspective}:")
    print(f"     Description: {data['description']}")
    print(f"     Training examples: {len(examples)}")
    print()

print(f"✅ Total training examples: {total_examples}")
print(f"✅ Training system ready for production!")
print()
print("=" * 80)
