import sys

def check_balance(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    stack = []
    pairs = {'(': ')', '{': '}', '[': ']'}
    lines = content.split('\n')
    
    for i, line in enumerate(lines):
        for char in line:
            if char in pairs:
                stack.append((char, i + 1))
            elif char in pairs.values():
                if not stack:
                    print(f"Excess closing {char} at line {i + 1}")
                    return
                opening, line_num = stack.pop()
                if pairs[opening] != char:
                    print(f"Mismatched {opening} from line {line_num} with {char} at line {i + 1}")
                    return
    
    if stack:
        for char, line_num in stack:
            print(f"Unclosed {char} from line {line_num}")
    else:
        print("All brackets balanced!")

if __name__ == "__main__":
    check_balance(sys.argv[1])
