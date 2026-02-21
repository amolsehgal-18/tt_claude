import csv
import random

input_file = '/Users/amolsehgal/antigravity - touchline tantrum/touchline_tantrum/assets/cards.csv'
output_file = '/Users/amolsehgal/antigravity - touchline tantrum/touchline_tantrum/assets/cards_new.csv'

def calculate_dressing_room_impact(row):
    text = row.get('Scenario_Text', '').lower()
    category = row.get('Image_Category', '')
    game_cat = row.get('Game_Category', '')
    
    # default small random impact
    impact = random.choice([-2, 0, 2])
    
    if 'player' in category or 'locker' in game_cat:
        # Higher stakes for player/locker related stuff
        impact = random.choice([-8, -5, 5, 8])
        
    if 'contract' in text or 'wages' in text or 'bonus' in text:
         impact = random.choice([-10, 10])

    if 'training' in text:
        impact = random.choice([-5, 5])

    return impact

with open(input_file, 'r', encoding='utf-8') as infile, open(output_file, 'w', encoding='utf-8', newline='') as outfile:
    # Handle possible header issues
    reader = csv.DictReader(infile)
    fieldnames = [f for f in reader.fieldnames if f] # Remove empty fieldnames if any
    
    # Insert new column after Fan_Impact
    new_fieldnames = list(fieldnames)
    if 'Dressing_Room_Impact' not in new_fieldnames:
        if 'Fan_Impact' in new_fieldnames:
            index = new_fieldnames.index('Fan_Impact') + 1
            new_fieldnames.insert(index, 'Dressing_Room_Impact')
        else:
             new_fieldnames.append('Dressing_Room_Impact')
    
    writer = csv.DictWriter(outfile, fieldnames=new_fieldnames, extrasaction='ignore') # Ignore extra keys (like None)
    writer.writeheader()
    
    for row in reader:
        # Clean up row keys
        if None in row:
            del row[None]
            
        if 'Dressing_Room_Impact' not in row or not row['Dressing_Room_Impact']:
             row['Dressing_Room_Impact'] = calculate_dressing_room_impact(row)
        
        writer.writerow(row)

print("CSV updated successfully.")
