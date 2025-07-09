NLD 0000-0nnn-00nn DeweyMatrixDataAnalysis.md

``` python?code_reference&code_event_index=2
import pandas as pd

pd.set_option('display.max_rows', None)
pd.set_option('display.max_columns', None)

# Read the CSV file into a DataFrame
df = pd.read_csv('DeweyMatrix.DataTypes and recursive interaction-Sheet1-v1.csv')

# Display the first 5 rows
print(df.head().to_string(index=False))

# Print the column names and their data types
print(df.info())

```

``` text?code_stdout&code_event_index=2
null(0(zero)) null(0(zero)).1    null(0(zero)).2  null(0(zero)).3  null(0(zero)).4      null(0(zero)).5        null(0(zero)).6    null(0(zero)).7      null(0(zero)).8          null(0(zero)).9
null(0(zero))      self(self)      self(thought)      self(logic)      self(unity)      self(existence)      self(improvement)      self(mastery)      self(resonance)      self(transcendance)
null(0(zero))   thought(self)   thought(thought)   thought(logic)   thought(unity)   thought(existence)   thought(improvement)   thought(mastery)   thought(resonance)   thought(transcendance)
null(0(zero))     logic(self)     logic(thought)     logic(logic)     logic(unity)     logic(existence)     logic(improvement)     logic(mastery)     logic(resonance)     logic(transcendance)
null(0(zero))     unity(self)     unity(thought)     unity(logic)     unity(unity)     unity(existence)     unity(improvement)     unity(mastery)     unity(resonance)     unity(transcendance)
null(0(zero)) existence(self) existence(thought) existence(logic) existence(unity) existence(existence) existence(improvement) existence(mastery) existence(resonance) existence(transcendance)
<class 'pandas.core.frame.DataFrame'>
RangeIndex: 9 entries, 0 to 8
Data columns (total 10 columns):
 #   Column           Non-Null Count  Dtype 
---  ------           --------------  ----- 
 0   null(0(zero))    9 non-null      object
 1   null(0(zero)).1  9 non-null      object
 2   null(0(zero)).2  9 non-null      object
 3   null(0(zero)).3  9 non-null      object
 4   null(0(zero)).4  9 non-null      object
 5   null(0(zero)).5  9 non-null      object
 6   null(0(zero)).6  9 non-null      object
 7   null(0(zero)).7  9 non-null      object
 8   null(0(zero)).8  9 non-null      object
 9   null(0(zero)).9  9 non-null      object
dtypes: object(10)
memory usage: 848.0+ bytes
None

```

The first few rows suggest that the dataset includes metadata before the actual header, as row 2 contains meaningful column names like `self(self)`, `self(thought)`, `self(logic)`, `self(unity)`, `self(existence)`, `self(improvement)`, `self(mastery)`, `self(resonance)`, and `self(transcendance)` that are relevant to the user request and accurately describe the data below. To address this, I'll reload the dataset using the same parameters as before, adding the 'header' parameter set to 1 (accounting for the 0-based index). I'll then display the first 5 rows along with the columns and their types, as the reload might alter the column types.

``` python?code_reference&code_event_index=5
# Read the CSV file into a DataFrame, using the row with index 1 as the header
df = pd.read_csv('DeweyMatrix.DataTypes and recursive interaction-Sheet1-v1.csv', header=1)

# Display the first 5 rows
print(df.head().to_string(index=False))

# Print the column names and their data types
print(df.info())

```

``` text?code_stdout&code_event_index=5
null(0(zero))        self(self)        self(thought)        self(logic)        self(unity)        self(existence)        self(improvement)        self(mastery)        self(resonance)        self(transcendance)
null(0(zero))     thought(self)     thought(thought)     thought(logic)     thought(unity)     thought(existence)     thought(improvement)     thought(mastery)     thought(resonance)     thought(transcendance)
null(0(zero))       logic(self)       logic(thought)       logic(logic)       logic(unity)       logic(existence)       logic(improvement)       logic(mastery)       logic(resonance)       logic(transcendance)
null(0(zero))       unity(self)       unity(thought)       unity(logic)       unity(unity)       unity(existence)       unity(improvement)       unity(mastery)       unity(resonance)       unity(transcendance)
null(0(zero))   existence(self)   existence(thought)   existence(logic)   existence(unity)   existence(existence)   existence(improvement)   existence(mastery)   existence(resonance)   existence(transcendance)
null(0(zero)) improvement(self) improvement(thought) improvement(logic) improvement(unity) improvement(existence) improvement(improvement) improvement(mastery) improvement(resonance) improvement(transcendance)
<class 'pandas.core.frame.DataFrame'>
RangeIndex: 8 entries, 0 to 7
Data columns (total 10 columns):
 #   Column               Non-Null Count  Dtype 
---  ------               --------------  ----- 
 0   null(0(zero))        8 non-null      object
 1   self(self)           8 non-null      object
 2   self(thought)        8 non-null      object
 3   self(logic)          8 non-null      object
 4   self(unity)          8 non-null      object
 5   self(existence)      8 non-null      object
 6   self(improvement)    8 non-null      object
 7   self(mastery)        8 non-null      object
 8   self(resonance)      8 non-null      object
 9   self(transcendance)  8 non-null      object
dtypes: object(10)
memory usage: 768.0+ bytes
None

```

The column `null(0(zero))` appears to contain redundant information, as it consists solely of `null(0(zero))` values, making it unsuitable for direct analysis. I'll remove this column to streamline the dataset.

Next, I'll rename the columns by extracting the text within the parentheses, such as changing 'self(self)' to 'self' and 'self(thought)' to 'thought'. This will make the column names more concise and readable.

Finally, I'll display the first 5 rows along with the columns and their types to ensure the changes have been applied correctly.

``` python?code_reference&code_event_index=8
# Drop the `null(0(zero))` column
df = df.drop(columns=['null(0(zero))'])

# Rename the columns by extracting the text within the parentheses
df.columns = df.columns.str.extract(r'\((.*?)\)').iloc[0]

# Display the first 5 rows
print(df.head().to_string(index=False))

# Print the column names and their data types
print(df.info())

```

``` text?code_stderr&code_event_index=8
Traceback (most recent call last):
  File "<string>", line 26, in <module>
  File "generic.py", line 5915, in __setattr__
    return object.__setattr__(self, name, value)
  File "properties.pyx", line 69, in pandas._libs.properties.AxisProperty.__set__
  File "generic.py", line 823, in _set_axis
    self._mgr.set_axis(axis, labels)
  File "managers.py", line 230, in set_axis
    self._validate_set_axis(axis, new_labels)
  File "base.py", line 70, in _validate_set_axis
    raise ValueError(
ValueError: Length mismatch: Expected axis has 9 elements, new values have 1 elements

```

The previous attempt to rename columns failed because the `df.columns.str.extract(r'\((.*?)\)').iloc[0]` operation resulted in a single-element Series, which cannot be assigned to a DataFrame with 9 columns. This indicates that the extraction logic might be incorrect or that `iloc[0]` is not the right way to access the extracted column names.

Let's re-examine the column names. The column names are in the format `text(value)`. The intention is to extract `value` from each column name.

To fix this, I'll apply a `lambda` function to each column name to extract the text within the parentheses.

Finally, I'll display the first 5 rows along with the columns and their types to ensure the changes have been applied correctly.

``` python?code_reference&code_event_index=11
# Rename the columns by extracting the text within the parentheses
df.columns = df.columns.map(lambda x: x.split('(')[1][:-1])

# Display the first 5 rows
print(df.head().to_string(index=False))

# Print the column names and their data types
print(df.info())

```

``` text?code_stdout&code_event_index=11
             self              thought              logic              unity              existence              improvement              mastery              resonance              transcendance
    thought(self)     thought(thought)     thought(logic)     thought(unity)     thought(existence)     thought(improvement)     thought(mastery)     thought(resonance)     thought(transcendance)
      logic(self)       logic(thought)       logic(logic)       logic(unity)       logic(existence)       logic(improvement)       logic(mastery)       logic(resonance)       logic(transcendance)
      unity(self)       unity(thought)       unity(logic)       unity(unity)       unity(existence)       unity(improvement)       unity(mastery)       unity(resonance)       unity(transcendance)
  existence(self)   existence(thought)   existence(logic)   existence(unity)   existence(existence)   existence(improvement)   existence(mastery)   existence(resonance)   existence(transcendance)
improvement(self) improvement(thought) improvement(logic) improvement(unity) improvement(existence) improvement(improvement) improvement(mastery) improvement(resonance) improvement(transcendance)
<class 'pandas.core.frame.DataFrame'>
RangeIndex: 8 entries, 0 to 7
Data columns (total 9 columns):
 #   Column         Non-Null Count  Dtype 
---  ------         --------------  ----- 
 0   self           8 non-null      object
 1   thought        8 non-null      object
 2   logic          8 non-null      object
 3   unity          8 non-null      object
 4   existence      8 non-null      object
 5   improvement    8 non-null      object
 6   mastery        8 non-null      object
 7   resonance      8 non-null      object
 8   transcendance  8 non-null      object
dtypes: object(9)
memory usage: 704.0+ bytes
None

```

The column names have been successfully extracted and renamed. However, the first row of the DataFrame contains values that are essentially the same as the column names (e.g., 'thought(self)' in the 'self' column, 'thought(thought)' in the 'thought' column). This row serves as a redundant header and should be removed to avoid duplication and ensure that only the actual data is processed.

To address this, I'll drop the first row of the DataFrame.

Finally, I'll display the first 5 rows along with the columns and their types to ensure the changes have been applied correctly.

``` python?code_reference&code_event_index=14
# Drop the first row
df = df.iloc[1:]

# Display the first 5 rows
print(df.head().to_string(index=False))

# Print the column names and their data types
print(df.info())

```

``` text?code_stdout&code_event_index=14
             self              thought              logic              unity              existence              improvement              mastery              resonance              transcendance
      logic(self)       logic(thought)       logic(logic)       logic(unity)       logic(existence)       logic(improvement)       logic(mastery)       logic(resonance)       logic(transcendance)
      unity(self)       unity(thought)       unity(logic)       unity(unity)       unity(existence)       unity(improvement)       unity(mastery)       unity(resonance)       unity(transcendance)
  existence(self)   existence(thought)   existence(logic)   existence(unity)   existence(existence)   existence(improvement)   existence(mastery)   existence(resonance)   existence(transcendance)
improvement(self) improvement(thought) improvement(logic) improvement(unity) improvement(existence) improvement(improvement) improvement(mastery) improvement(resonance) improvement(transcendance)
    mastery(self)     mastery(thought)     mastery(logic)     mastery(unity)     mastery(existence)     mastery(improvement)     mastery(mastery)     mastery(resonance)     mastery(transcendance)
<class 'pandas.core.frame.DataFrame'>
RangeIndex: 7 entries, 1 to 7
Data columns (total 9 columns):
 #   Column         Non-Null Count  Dtype 
---  ------         --------------  ----- 
 0   self           7 non-null      object
 1   thought        7 non-null      object
 2   logic          7 non-null      object
 3   unity          7 non-null      object
 4   existence      7 non-null      object
 5   improvement    7 non-null      object
 6   mastery        7 non-null      object
 7   resonance      7 non-null      object
 8   transcendance  7 non-null      object
dtypes: object(9)
memory usage: 636.0+ bytes
None

```

The data in the DataFrame is currently in a wide format, where each column represents a different aspect of the 'self' dimension (e.g., 'self', 'thought', 'logic'). Each cell contains a string in the format 'category(value)', such as 'logic(self)', 'logic(thought)', etc. To effectively analyze the relationships between these categories, it's necessary to transform the data into a long format. This involves melting the DataFrame to create two new columns: 'Category' (representing the original column names, which are the 'self' aspects) and 'Value' (representing the cell contents, which are the 'category(value)' strings).

After melting, the 'Value' column will still contain strings like 'logic(self)'. To make this data more usable for analysis, I'll extract the 'category' from these strings (e.g., 'logic' from 'logic(self)') and store it in a new column called 'Subcategory'. This will allow for a clearer understanding of the interactions between the main categories and their subcategories.

Finally, I'll display the first 5 rows along with the columns and their types to ensure the changes have been applied correctly.

``` python?code_reference&code_event_index=17
# Melt the DataFrame to transform it into a long format
df_melted = df.melt(var_name='Category', value_name='Value')

# Extract the 'Subcategory' from the 'Value' column
df_melted['Subcategory'] = df_melted['Value'].str.split('(').str[0]

# Display the first 5 rows
print(df_melted.head().to_string(index=False))

# Print the column names and their data types
print(df_melted.info())

```

``` text?code_stdout&code_event_index=17
Category             Value Subcategory
    self       logic(self)       logic
    self       unity(self)       unity
    self   existence(self)   existence
    self improvement(self) improvement
    self     mastery(self)     mastery
<class 'pandas.core.frame.DataFrame'>
RangeIndex: 63 entries, 0 to 62
Data columns (total 3 columns):
 #   Column       Non-Null Count  Dtype 
---  ------       --------------  ----- 
 0   Category     63 non-null     object
 1   Value        63 non-null     object
 2   Subcategory  63 non-null     object
dtypes: object(3)
memory usage: 1.6+ KB
None

```

The data is now in a long format with 'Category' and 'Subcategory' columns. To analyze the interactions between these categories, I'll create a heatmap. The heatmap will show the frequency of each 'Category' and 'Subcategory' combination.

To prepare the data for the heatmap, I'll first calculate the counts of each unique combination of 'Category' and 'Subcategory'. This will be done by grouping the `df_melted` DataFrame by 'Category' and 'Subcategory' and then counting the occurrences.

After calculating the counts, I'll create a heatmap using Altair. The 'Category' will be mapped to the x-axis, 'Subcategory' to the y-axis, and the 'Count' to the color intensity. This visualization will allow for a clear representation of the frequency of interactions between the different 'self' aspects.

Finally, I'll save the chart as a JSON file.

``` python?code_reference&code_event_index=20
import altair as alt

# Calculate the count of each combination of 'Category' and 'Subcategory'
df_heatmap = df_melted.groupby(['Category', 'Subcategory']).size().reset_index(name='Count')

# Create a heatmap
chart = alt.Chart(df_heatmap).mark_rect().encode(
    x=alt.X('Category:N', title='Category'),
    y=alt.Y('Subcategory:N', title='Subcategory'),
    color=alt.Color('Count:Q', title='Count'),
    tooltip=['Category', 'Subcategory', 'Count']
).properties(
    title='Interaction Matrix of Self Dimensions'
)

# Save the chart
chart.save('interaction_matrix_heatmap.json')

```

\[json-tag: code-generated-json-21-0-1751926666044111361\]

The `Interaction Matrix of Self Dimensions` heatmap shows that each category (self, thought, logic, unity, existence, improvement, mastery, resonance, transcendance) interacts uniformly with every subcategory (existence, improvement, logic, mastery, resonance, transcendance, unity). This is indicated by a count of 1 for every combination, meaning each `Category` appears once with each `Subcategory`.

Here are some key takeaways:

  * **Uniform Interaction:** Every 'Category' (e.g., 'self', 'thought', 'logic') interacts exactly once with every 'Subcategory' (e.g., 'existence', 'improvement', 'logic'). This suggests a consistent and complete set of relationships across all dimensions.
  * **No Dominant Interactions:** There are no specific category-subcategory pairs that show a higher frequency of interaction, indicating that no single dimension or sub-dimension is more prominent or central in its relationships than others.

Let me know if you would like to explore specific relationships or patterns in more detail\!
